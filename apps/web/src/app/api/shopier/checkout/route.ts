import { NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Shopier Ödeme Başlatma Ucu (/api/shopier/checkout)
 * Hem Shopier Özel API (SHOPIER_API_KEY + SHOPIER_API_SECRET) hem de
 * Shopier Ürün Linki (SHOPIER_LINK_STANDARD / PRO / ENTERPRISE) modlarını destekler.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      businessId,
      businessName,
      planTier,
      planName,
      billingCycle,
      amount,
      buyerName,
      buyerEmail,
      buyerPhone,
      buyerAddress,
      buyerCity,
    } = body;

    if (!businessId || !planTier || !amount) {
      return NextResponse.json(
        { error: 'Eksik sipariş bilgisi (businessId, planTier, amount zorunludur).' },
        { status: 400 }
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
      return NextResponse.json({
        mode: 'sandbox',
        message: 'Shopier hesabı onay sürecinde. Sandbox / Test modu kullanılıyor.',
      });
    }

    // Sipariş numarası içinde businessId, planTier ve billingCycle bilgisini taşıyoruz
    // Böylece callback geldiğinde hangi işletmenin hangi paketi aldığını %100 kesin biliriz.
    const randomNr = Math.floor(100000 + Math.random() * 900000).toString();
    const platformOrderId = `${businessId}__${planTier}__${billingCycle || 'monthly'}__${Date.now()}`;
    const totalOrderValue = Number(amount).toFixed(2);
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
      product_name: `RANDEVORY ${planName} (${billingCycle === 'yearly' ? 'Yıllık' : 'Aylık'} Lisans)`,
      product_type: '1', // 1 = Dijital / İndirilebilir Hizmet (Kargo gerektirmez)
      buyer_name: firstName,
      buyer_surname: lastName,
      buyer_email: buyerEmail || 'iletisim@randevory.com',
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
      current_language: '0', // 0 = TR
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
    return NextResponse.json(
      { error: err.message || 'Shopier ödeme oturumu başlatılamadı.' },
      { status: 500 }
    );
  }
}
