import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';

async function runBillingVerification() {
  console.log('💳 RANDEVORY Lisans & Ödeme Sistemi Testi Başlatılıyor...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 850 });

  try {
    // 1. GİRİŞ YAP
    console.log('\n[ADIM 1] Test İşletme Hesabı ile Giriş Yapılıyor...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await page.type('input[type="email"]', 'test_merchant_2026@randevo.pro');
    await page.type('input[type="password"]', 'MerchantPass2026!');
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
    console.log('  -> Giriş başarılı, URL:', page.url());

    // 2. SIDEBARDA "ABONELİK & LİSANS" KONTROLÜ
    console.log('\n[ADIM 2] Menüde "Abonelik & Lisans" Bağlantısı Kontrol Ediliyor...');
    const billingLink = await page.$('a[href="/dashboard/billing"]');
    if (!billingLink) throw new Error('Menüde /dashboard/billing bağlantısı bulunamadı!');
    console.log('  -> Menüde "Abonelik & Lisans" bağlantısı doğrulandı.');

    // 3. BİLLİNG SAYFASINA GİT
    console.log('\n[ADIM 3] Abonelik & Lisans Sayfası Açılıyor...');
    await page.goto(`${BASE_URL}/dashboard/billing`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('h1', { timeout: 10000 });

    const pageTitle = await page.$eval('h1', el => el.innerText);
    console.log(`  -> Sayfa Başlığı: "${pageTitle}"`);
    if (!pageTitle.includes('Abonelik ve Lisans')) throw new Error('Başlık eşleşmedi!');

    // 4. PLAN KARTLARINI DOĞRULA
    const planCards = await page.$$eval('h3', els => els.map(e => e.innerText));
    console.log('  -> Görüntülenen Paketler:', planCards);
    const hasPlans = planCards.some(p => p.includes('Standart')) && planCards.some(p => p.includes('Profesyonel'));
    if (!hasPlans) throw new Error('Paket kartları eksik!');

    // 5. PROFESYONEL PAKETİ SATIN ALMA MODALINI AÇ
    console.log('\n[ADIM 4] Profesyonel Paket İçin "Lisansı Satın Al" Tıklanıyor...');
    const buttons = await page.$$('button');
    let upgradeBtn = null;
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.innerText, btn);
      if (text.includes('Lisansı Satın Al') || text.includes('Bu Pakete Geç')) {
        upgradeBtn = btn;
        break;
      }
    }

    if (!upgradeBtn) throw new Error('Lisans satın alma butonu bulunamadı!');
    await upgradeBtn.click();
    await new Promise(r => setTimeout(r, 600));

    // Modal açıldı mı?
    const modalTitle = await page.$eval('h3', el => el.innerText);
    console.log(`  -> Ödeme Modalı Açıldı: "${modalTitle}"`);

    // 6. TEST KARTINI DOLDUR
    console.log('\n[ADIM 5] Test Kartı Bilgileri Otomatik Dolduruluyor...');
    const fillTestCardBtn = await page.$('button[type="button"]');
    await fillTestCardBtn.click();
    await new Promise(r => setTimeout(r, 300));

    const cardNum = await page.$eval('input[placeholder*="0000"]', el => el.value);
    console.log(`  -> Doldurulan Kart Numarası: ${cardNum}`);
    if (!cardNum.includes('5400')) throw new Error('Test kartı doldurulamadı!');

    // 7. ÖDEMEYİ GÖNDER VE ONAYLA
    console.log('\n[ADIM 6] 3D Secure Lisans Ödemesi Gönderiliyor...');
    const paySubmitBtn = await page.$('form button[type="submit"]');
    await paySubmitBtn.click();

    // Başarı ekranını bekle
    console.log('  -> 3D Secure onayı bekleniyor...');
    await page.waitForFunction(() => {
      return document.body.innerText.includes('Tebrikler! Lisansınız Aktifleştirildi');
    }, { timeout: 15000 });

    console.log('  -> 🎉 Ödeme onaylandı ve lisans anında aktifleştirildi!');

    // Modal kapat ve yenilenen sayfayı kontrol et
    const closeBtn = await page.$('button[class*="bg-slate-900"]');
    if (closeBtn) await closeBtn.click();
    await new Promise(r => setTimeout(r, 1000));

    const activeTierName = await page.$eval('h2', el => el.innerText);
    console.log(`  -> Güncel Aktif Paket Adı: "${activeTierName}"`);

    console.log('\n✅ TÜM LİSANS VE ÖDEME TESTLERİ %100 BAŞARIYLA GEÇTİ!');
  } catch (err) {
    console.error('\n❌ TEST HATASI:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runBillingVerification();
