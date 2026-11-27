import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const ALLOWED_TIERS = new Set(['standard', 'pro', 'enterprise']);

/**
 * Shopier Ödeme Başlatma Ucu (/api/shopier/checkout)
 * Hem Shopier Özel API (SHOPIER_API_KEY + SHOPIER_API_SECRET) hem de
 * Shopier Ürün Linki (SHOPIER_LINK_STANDARD / PRO / ENTERPRISE) modlarını destekler.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Ödeme başlatmak için oturum açmanız gerekmektedir.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      businessId,
      businessName,
      planTier,
      planName,
      billingCycle,
      buyerName,
      buyerEmail,
      buyerPhone,
      buyerAddress,
      buyerCity,
    } = body;

    if (!businessId || !planTier || !ALLOWED_TIERS.has(String(planTier))) {
      return NextResponse.json(
        { error: 'Geçersiz veya eksik sipariş bilgisi (businessId ve planTier zorunludur).' },
        { status: 400 }
      );
    }

    // Kullanıcının ilgili işletmenin üyesi/sahibi olduğunu doğrula
    const { data: membership } = await supabase
      .from('business_members')
      .select('business_id')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        { error: 'Bu işletme için ödeme başlatma yetkiniz bulunmamaktadır.' },
        { status: 403 }
      );
    }

    // 1. Önce Shopier Ürün Linki tanımlı mı kontrol et
    const linkMap: Record<string, string | undefined> = {
      standard: process.env.NEXT_PUBLIC_SHOPIER_LINK_STANDARD || 'https://www.shopier.com/randevory/52712584',
      pro: process.env.NEXT_PUBLIC_SHOPIER_LINK_PRO || 'https://www.shopier.com/randevory/52712622',
      enterprise: process.env.NEXT_PUBLIC_SHOPIER_LINK_ENTERPRISE || 'https://www.shopier.com/randevory/52712658',
    };

    const directProductLink = linkMap[planTier];
    if (directProductLink) {
      return NextResponse.json({
        mode: 'redirect_link',
        redirectUrl: directProductLink,
      });
    }

    // 2. Shopier API Key & Secret tanımlı mı kontrol et
    const apiKey = process.env.SHOPIER_API_KEY;
    const apiSecret = process.env.SHOPIER_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        {
          error: 'Ödeme altyapısı şu anda yapılandırma aşamasındadır. Lütfen destek ekibiyle iletişime geçin.',
        },
        { status: 503 }
      );
    }

    // Fiyatı asla istemciden alma — doğrudan veritabanındaki subscription_plans tablosundan çek
    const normalizedCycle = billingCycle === 'yearly' ? 'yearly' : 'monthly';
    const { data: planRow, error: planErr } = await supabase
      .from('subscription_plans')
      .select('name, price_monthly, price_yearly')
      .eq('tier', planTier)
      .eq('is_active', true)
      .maybeSingle();

    if (planErr || !planRow) {
      return NextResponse.json(
        { error: 'Seçilen abonelik paketi bulunamadı.' },
        { status: 404 }
      );
    }

    const authoritativeAmount =
      normalizedCycle === 'yearly'
        ? Number(planRow.price_yearly)
        : Number(planRow.price_monthly);

    if (!Number.isFinite(authoritativeAmount) || authoritativeAmount <= 0) {
      return NextResponse.json(
        { error: 'Paket tutarı doğrulanamadı.' },
        { status: 400 }
      );
    }

    const randomNr = crypto.randomInt(100000, 1000000).toString();
    const platformOrderId = `${businessId}__${planTier}__${normalizedCycle}__${Date.now()}`;
    const totalOrderValue = authoritativeAmount.toFixed(2);
    const currency = '0'; // 0 = TRY

    const nameParts = (buyerName || businessName || 'Isletme Yetkilisi').trim().split(' ');
    const firstName = nameParts[0] || 'Isletme';
    const lastName = nameParts.slice(1).join(' ') || 'Yetkilisi';

    // Shopier HMAC-SHA256 imza oluşturma: random_nr + platform_order_id + total_order_value + currency
    const signatureData = `${randomNr}${platformOrderId}${totalOrderValue}${currency}`;
    const signature = crypto
      .createHmac('sha256', apiSecret)
      .update(signatureData)
      .digest('base64');

    const { origin } = new URL(request.url);
    const callbackUrl = `${origin}/api/shopier/callback`;

    const formFields: Record<string, string> = {
      API_key: apiKey,
      website_index: process.env.SHOPIER_WEBSITE_INDEX || '1',
      platform_order_id: platformOrderId,
      product_name: `RANDEVORY ${planRow.name || planName} (${normalizedCycle === 'yearly' ? 'Yıllık' : 'Aylık'} Lisans)`,
      product_type: '1',
      buyer_name: firstName,
      buyer_surname: lastName,
      buyer_email: buyerEmail || user.email || 'iletisim@randevory.com',
      buyer_account_age: '0',
      buyer_id_nr: '0',
      buyer_phone: buyerPhone || '05000000000',
      billing_address: buyerAddress || 'Türkiye',
      billing_city: buyerCity || 'İstanbul',
      billing_country: 'Türkiye',
      billing_postcode: '34000',
      shipping_address: buyerAddress || 'Türkiye',
      shipping_city: buyerCity || 'İstanbul',
      shipping_country: 'Türkiye',
      shipping_postcode: '34000',
      total_order_value: totalOrderValue,
      currency: currency,
      platform: '0',
      is_in_frame: '0',
      current_language: '0',
      modul_version: '1.0.4',
      random_nr: randomNr,
      signature: signature,
      callback: callbackUrl,
    };

    return NextResponse.json({
      mode: 'form_post',
      endpoint: 'https://www.shopier.com/ShowProduct/api_pay4.php',
      formFields,
    });
  } catch (err: any) {
    console.error('Shopier checkout error:', err);
    return NextResponse.json(
      { error: 'Shopier ödeme oturumu başlatılamadı.' },
      { status: 500 }
    );
  }
}
