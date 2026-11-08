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

    const apiSecret = process.env.SHOPIER_API_SECRET || process.env.SHOPIER_OSB_SECRET || '';

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
      const osbUsername = process.env.SHOPIER_OSB_USERNAME || '';
      if (apiSecret) {
        const expectedHash = crypto
          .createHmac('sha256', apiSecret)
          .update(`${resParam}${osbUsername}`)
          .digest('hex');

        if (hashParam !== expectedHash) {
          return new NextResponse('INVALID_HASH', { status: 400 });
        }
      }

      const decodedJson = Buffer.from(resParam, 'base64').toString('utf-8');
      const orderData = JSON.parse(decodedJson);
      const buyerEmail = (orderData?.email || '').trim().toLowerCase();
      const buyerPhone = (orderData?.phone || '').replace(/\D/g, '').slice(-10);
      const rawProductId = String(orderData?.productid || orderData?.product_id || orderData?.item_id || '');
      const rawProductName = String(orderData?.productname || orderData?.product_name || '').toLowerCase();
      const price = Number(orderData?.price || 0);

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

        // 1. İşletme e-postasına göre ara
        if (buyerEmail) {
          const { data: biz } = await supabase
            .from('businesses')
            .select('id')
            .ilike('email', buyerEmail)
            .maybeSingle();

          if (biz?.id) targetBusinessId = biz.id;
        }

        // 2. İşletme telefonuna göre ara
        if (!targetBusinessId && buyerPhone) {
          const { data: allBiz } = await supabase
            .from('businesses')
            .select('id, phone')
            .limit(100);

          const matchedBiz = allBiz?.find(
            (b) => b.phone && b.phone.replace(/\D/g, '').slice(-10) === buyerPhone
          );
          if (matchedBiz) targetBusinessId = matchedBiz.id;
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
