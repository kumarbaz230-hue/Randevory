import crypto from 'crypto';

const SHOPIER_OSB_USERNAME = 'b33b093cc4d9e32cffaa7468ab99ea51';
const SHOPIER_OSB_SECRET = '85dc8c8e18a4732b99d005aeef111721';
const TARGET_URL = 'https://www.randevory.com/api/shopier/callback';

async function sendWebhook(orderPayload) {
  const resParam = Buffer.from(JSON.stringify(orderPayload)).toString('base64');
  const hashParam = crypto
    .createHmac('sha256', SHOPIER_OSB_SECRET)
    .update(`${resParam}${SHOPIER_OSB_USERNAME}`)
    .digest('hex');

  const formData = new URLSearchParams();
  formData.append('res', resParam);
  formData.append('hash', hashParam);

  const res = await fetch(TARGET_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Shopier-OSB-Webhook-Client/1.0',
    },
    body: formData.toString(),
  });

  const text = await res.text();
  return { status: res.status, text };
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('🧪 RANDEVORY & SHOPIER CANLI ENTEGRASYON VE DOĞRULAMA TESTLERİ');
  console.log('================================================================\n');

  // TEST 1: STANDART PAKET (149 TL)
  console.log('▶ TEST 1: Standart Paket (149 ₺) - Ürün ID: 52712584');
  const t1 = await sendWebhook({
    orderid: 'TEST_STANDART_' + Date.now(),
    email: 'kumar.baz230@gmail.com',
    phone: '05367307298',
    price: 149.00,
    currency: 'TRY',
    productname: 'RANDEVORY Standart Lisans Paketi',
    productid: '52712584',
    buyername: 'Mustafa Test',
    date: new Date().toISOString()
  });
  console.log(`  Sonuç: HTTP ${t1.status} - "${t1.text}" -> ${t1.status === 200 && t1.text === 'success' ? '✅ GEÇTİ' : '❌ KALDI'}`);

  // TEST 2: SADECE TELEFONLA EŞLEŞTİRME (Müşteri farklı e-posta yazarsa)
  console.log('\n▶ TEST 2: Farklı e-posta ile ama aynı telefonla (05367307298)');
  const t2 = await sendWebhook({
    orderid: 'TEST_PHONE_' + Date.now(),
    email: 'bambaska_musteri@gmail.com', // Farklı e-posta
    phone: '05367307298',                // İşletmenin kayıtlı telefonu
    price: 149.00,
    currency: 'TRY',
    productname: 'RANDEVORY Standart Lisans Paketi',
    productid: '52712584',
    buyername: 'Ahmet Yılmaz',
    date: new Date().toISOString()
  });
  console.log(`  Sonuç: HTTP ${t2.status} - "${t2.text}" -> ${t2.status === 200 && t2.text === 'success' ? '✅ GEÇTİ' : '❌ KALDI'}`);

  console.log('\n================================================================');
  console.log('🎉 TÜM CANLI TESTLER TAMAMLANDI!');
  console.log('================================================================');
}

runTestSuite().catch(console.error);
