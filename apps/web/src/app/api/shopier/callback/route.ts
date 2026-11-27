import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const ALLOWED_TIERS = new Set(['standard', 'pro', 'enterprise']);
const ALLOWED_CYCLES = new Set(['monthly', 'yearly']);
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function timingSafeEquals(a: string, b: string): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

async function getCallbackSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && serviceKey) {
    return createSupabaseJsClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return createServerSupabaseClient();
}

/**
 * Shopier Otomatik Sipariş Bildirimi (OSB / Callback) Ucu (/api/shopier/callback)
 * Shopier ödeme tamamlandığında bu adrese POST isteği gönderir.
 * İmza doğrulandıktan sonra işletmenin lisansı otomatik yükseltilir.
 */
export async function POST(request: Request) {
  const { origin } = new URL(request.url);

  try {
    const formData = await request.formData();

    // 1. Standart Shopier API Callback parametreleri
    const platformOrderId = (formData.get('platform_order_id') as string) || '';
    const status = (formData.get('status') as string) || '';
    const paymentId = (formData.get('payment_id') as string) || '';
    const randomNr = (formData.get('random_nr') as string) || '';
    const signature = (formData.get('signature') as string) || '';

    // 2. Shopier OSB (Otomatik Sipariş Bildirimi) parametreleri (res + hash)
    const resParam = (formData.get('res') as string) || '';
    const hashParam = (formData.get('hash') as string) || '';

    const apiSecret =
      process.env.SHOPIER_API_SECRET ||
      process.env.SHOPIER_OSB_SECRET ||
      '85dc8c8e18a4732b99d005aeef111721';
    const osbUsername =
      process.env.SHOPIER_OSB_USERNAME || 'b33b093cc4d9e32cffaa7468ab99ea51';

    // Durum A: Shopier API Callback Doğrulaması
    if (platformOrderId && status) {
      // İmza ve random_nr zorunludur; eksik veya geçersizse kesinlikle reddet
      if (!apiSecret || !signature || !randomNr) {
        return NextResponse.redirect(`${origin}/dashboard/billing?payment=invalid_signature`);
      }

      const expectedSig = crypto
        .createHmac('sha256', apiSecret)
        .update(`${randomNr}${platformOrderId}`)
        .digest('base64');

      if (!timingSafeEquals(signature, expectedSig)) {
        return NextResponse.redirect(`${origin}/dashboard/billing?payment=invalid_signature`);
      }

      if (status.toLowerCase() === 'success') {
        const parts = platformOrderId.split('__');
        const businessId = parts[0];
        const rawTier = (parts[1] || 'pro').toLowerCase();
        const rawCycle = (parts[2] || 'monthly').toLowerCase();

        if (
          !UUID_REGEX.test(businessId) ||
          !ALLOWED_TIERS.has(rawTier) ||
          !ALLOWED_CYCLES.has(rawCycle)
        ) {
          return NextResponse.redirect(`${origin}/dashboard/billing?payment=failed`);
        }

        const planTier = rawTier as 'standard' | 'pro' | 'enterprise';
        const billingCycle = rawCycle as 'monthly' | 'yearly';

        await activateBusinessLicense(
          businessId,
          planTier,
          billingCycle,
          paymentId || platformOrderId,
          apiSecret
        );

        return NextResponse.redirect(
          `${origin}/dashboard/billing?payment=success&tier=${encodeURIComponent(planTier)}`
        );
      }

      return NextResponse.redirect(`${origin}/dashboard/billing?payment=failed`);
    }

    // Durum B: Shopier OSB (Otomatik Sipariş Bildirimi) JSON Base64 Akışı
    if (resParam && hashParam) {
      if (!apiSecret || !osbUsername) {
        return new NextResponse('MISCONFIGURED', { status: 500 });
      }

      const expectedHash = crypto
        .createHmac('sha256', apiSecret)
        .update(`${resParam}${osbUsername}`)
        .digest('hex');

      if (!timingSafeEquals(hashParam.toLowerCase(), expectedHash.toLowerCase())) {
        console.warn('Shopier OSB hash mismatch');
        return new NextResponse('INVALID_HASH', { status: 400 });
      }

      const decodedJson = Buffer.from(resParam, 'base64').toString('utf-8');
      const orderData = JSON.parse(decodedJson);
      const buyerEmail = (orderData?.email || orderData?.buyer_email || '').trim().toLowerCase();
      const buyerPhone = (orderData?.phone || orderData?.buyer_phone || '').replace(/\D/g, '').slice(-10);
      const rawProductId = String(orderData?.productid || orderData?.product_id || orderData?.item_id || '');
      const rawProductName = String(orderData?.productname || orderData?.product_name || '').toLowerCase();
      const price = Number(orderData?.price || orderData?.total_price || 0);

      // Fiyata, ürün adına veya Shopier ürün ID'sine göre paketi belirle
      let detectedTier: 'standard' | 'pro' | 'enterprise' = 'standard';
      if (rawProductId.includes('52712658') || rawProductName.includes('kurumsal') || price >= 500) {
        detectedTier = 'enterprise';
      } else if (rawProductId.includes('52712622') || rawProductName.includes('profesyonel') || price >= 250) {
        detectedTier = 'pro';
      } else {
        detectedTier = 'standard';
      }

      if (buyerEmail || buyerPhone) {
        const supabase = await getCallbackSupabaseClient();
        let targetBusinessId: string | null = null;

        // 1. Doğrulanmış webhook sırrı ile işletmeyi bul
        const { data: contacts } = await supabase.rpc('find_business_by_contact', {
          p_email: buyerEmail,
          p_phone: buyerPhone,
          p_webhook_secret: apiSecret,
        });

        if (contacts && contacts.length > 0 && contacts[0].business_id) {
          targetBusinessId = contacts[0].business_id;
        }

        // 2. Doğrudan businesses.email yedek kontrolü
        if (!targetBusinessId && buyerEmail) {
          const { data: biz } = await supabase
            .from('businesses')
            .select('id')
            .ilike('email', buyerEmail)
            .maybeSingle();

          if (biz?.id) targetBusinessId = biz.id;
        }

        if (targetBusinessId) {
          const orderId = String(orderData?.orderid || orderData?.order_id || '');
          await activateBusinessLicense(
            targetBusinessId,
            detectedTier,
            'monthly',
            orderId || undefined,
            apiSecret
          );
        }
      }

      return new NextResponse('success', { status: 200 });
    }

    // Durum C: Shopier Bağlantı ve Ping Testi
    const acceptHeader = request.headers.get('accept') || '';
    if (
      acceptHeader.includes('application/json') ||
      acceptHeader.includes('text/plain') ||
      !acceptHeader.includes('text/html')
    ) {
      return new NextResponse('OK', { status: 200 });
    }

    return NextResponse.redirect(`${origin}/dashboard/billing`);
  } catch (err) {
    console.error('Shopier callback error:', err);
    return new NextResponse('ERROR', { status: 400 });
  }
}

async function activateBusinessLicense(
  businessId: string,
  tier: 'standard' | 'pro' | 'enterprise',
  billingCycle: 'monthly' | 'yearly',
  paymentId: string | undefined,
  webhookSecret: string
) {
  const supabase = await getCallbackSupabaseClient();

  const { data: rpcData, error: rpcError } = await supabase.rpc(
    'activate_business_license_admin',
    {
      p_business_id: businessId,
      p_tier: tier,
      p_billing_cycle: billingCycle,
      p_order_id: paymentId || null,
      p_webhook_secret: webhookSecret,
    }
  );

  if (rpcError) {
    console.error('activate_business_license_admin RPC error:', rpcError.message);
    throw new Error('Lisans aktivasyonu gerçekleştirilemedi.');
  }

  console.log('License activated successfully via verified RPC:', rpcData);
}

export async function GET() {
  return new NextResponse('OK', { status: 200 });
}
