import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServerSupabaseClient } from '@/lib/supabase/server';

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
      if (apiSecret && signature) {
        const expectedSig = crypto
          .createHmac('sha256', apiSecret)
          .update(`${randomNr}${platformOrderId}`)
          .digest('base64');

        if (signature !== expectedSig) {
          return NextResponse.redirect(`${origin}/dashboard/billing?payment=invalid_signature`);
        }
      }

      if (status.toLowerCase() === 'success') {
        const parts = platformOrderId.split('__');
        const businessId = parts[0];
        const planTier = (parts[1] || 'pro') as 'standard' | 'pro' | 'enterprise';
        const billingCycle = (parts[2] || 'monthly') as 'monthly' | 'yearly';

        if (businessId) {
          await activateBusinessLicense(businessId, planTier, billingCycle, paymentId);
        }

        return NextResponse.redirect(
          `${origin}/dashboard/billing?payment=success&tier=${encodeURIComponent(planTier)}`
        );
      }

      return NextResponse.redirect(`${origin}/dashboard/billing?payment=failed`);
    }

    // Durum B: Shopier OSB (Otomatik Sipariş Bildirimi) JSON Base64 Akışı
    if (resParam && hashParam) {
      if (apiSecret) {
        const expectedHash = crypto
          .createHmac('sha256', apiSecret)
          .update(`${resParam}${osbUsername}`)
          .digest('hex');

        if (hashParam !== expectedHash) {
          console.warn('Shopier OSB hash mismatch:', { hashParam, expectedHash });
          return new NextResponse('INVALID_HASH', { status: 400 });
        }
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
        const supabase = await createServerSupabaseClient();
        let targetBusinessId: string | null = null;

        // 1. RLS bypass eden find_business_by_contact RPC ile işletmeyi bul
        const { data: contacts, error: contactErr } = await supabase.rpc('find_business_by_contact', {
          p_email: buyerEmail,
          p_phone: buyerPhone,
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
          await activateBusinessLicense(targetBusinessId, detectedTier, 'monthly', String(orderData?.orderid || ''));
        }
      }

      return new NextResponse('success', { status: 200 });
    }

    // Durum C: Shopier Bağlantı ve Ping Testi
    const acceptHeader = request.headers.get('accept') || '';
    if (acceptHeader.includes('application/json') || acceptHeader.includes('text/plain') || !acceptHeader.includes('text/html')) {
      return new NextResponse('OK', { status: 200 });
    }

    return NextResponse.redirect(`${origin}/dashboard/billing`);
  } catch (err) {
    console.error('Shopier callback error:', err);
    return new NextResponse('OK', { status: 200 });
  }
}

async function activateBusinessLicense(
  businessId: string,
  tier: 'standard' | 'pro' | 'enterprise',
  billingCycle: 'monthly' | 'yearly',
  paymentId?: string
) {
  const supabase = await createServerSupabaseClient();

  // 1. Önce PostgreSQL SECURITY DEFINER RPC ile RLS engeli olmadan aktifleştir
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    'activate_business_license_admin',
    {
      p_business_id: businessId,
      p_tier: tier,
      p_billing_cycle: billingCycle,
      p_order_id: paymentId || null,
    }
  );

  if (!rpcError) {
    console.log('License activated successfully via admin RPC:', rpcData);
    return;
  }

  console.error('activate_business_license_admin RPC error, trying direct update fallback:', rpcError);

  const now = new Date();
  const periodEnd = new Date(now);
  if (billingCycle === 'yearly') {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }

  // 1. businesses tablosundaki subscription_plan alanını güncelle
  await supabase
    .from('businesses')
    .update({ subscription_plan: tier })
    .eq('id', businessId);

  // 2. subscription_plans tablosundan ilgili planın id'sini bul
  const { data: planRow } = await supabase
    .from('subscription_plans')
    .select('id')
    .eq('tier', tier)
    .maybeSingle();

  if (planRow?.id) {
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('business_id', businessId)
      .maybeSingle();

    if (existingSub?.id) {
      await supabase
        .from('subscriptions')
        .update({
          plan_id: planRow.id,
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false,
          updated_at: now.toISOString(),
        })
        .eq('id', existingSub.id);
    } else {
      await supabase.from('subscriptions').insert({
        business_id: businessId,
        plan_id: planRow.id,
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
      });
    }
  }
}

export async function GET() {
  return new NextResponse('OK', { status: 200 });
}
