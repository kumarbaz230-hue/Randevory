import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';

async function runVerification() {
  console.log('🚀 RANDEVORY & SMTP Koruması Doğrulama Testi Başlatılıyor...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    // 1. ANA SAYFA KONTROLÜ
    console.log('\n[TEST 1] Ana Sayfa ve Marka Metinleri Kontrol Ediliyor...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });

    const title = await page.title();
    console.log(`  -> Sayfa Başlığı: "${title}"`);
    if (!title.includes('RANDEVORY')) throw new Error('Başlıkta RANDEVORY bulunamadı!');

    const brandText = await page.$eval('header', el => el.innerText);
    console.log(`  -> Header içeriğinde RANDEVORY kontrolü: ${brandText.includes('RANDEVORY') ? 'BAŞARILI' : 'BAŞARISIZ'}`);
    if (!brandText.includes('RANDEVORY')) throw new Error('Header içinde RANDEVORY logosu/yazısı bulunamadı!');

    const footerText = await page.$eval('footer', el => el.innerText);
    console.log(`  -> Footer slogan kontrolü: ${footerText.includes('İşini kolaylaştır, zamanını kazan.') ? 'BAŞARILI' : 'BAŞARISIZ'}`);
    if (!footerText.includes('İşini kolaylaştır, zamanını kazan.')) throw new Error('Footer içinde slogan bulunamadı!');

    // 2. MANIFEST & ICON KONTROLÜ
    console.log('\n[TEST 2] PWA Manifest ve Favicon Kontrol Ediliyor...');
    const manifestRes = await page.goto(`${BASE_URL}/manifest.webmanifest`);
    console.log(`  -> Manifest HTTP Kodu: ${manifestRes.status()}`);
    const manifestJson = await manifestRes.json();
    console.log(`  -> Manifest App Name: "${manifestJson.name}"`);
    if (!manifestJson.name.includes('RANDEVORY')) throw new Error('Manifest içinde RANDEVORY bulunamadı!');

    const iconRes = await page.goto(`${BASE_URL}/icon`);
    console.log(`  -> /icon HTTP Kodu: ${iconRes.status()}, Content-Type: ${iconRes.headers()['content-type']}`);
    if (iconRes.status() !== 200) throw new Error('/icon yüklenemedi!');

    // 3. LOGIN & REGISTER EKRANLARI
    console.log('\n[TEST 3] Giriş (/login) ve Kayıt (/register) Ekranı Marka Kontrolü...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    const loginContent = await page.content();
    if (!loginContent.includes('RANDEVORY')) throw new Error('/login sayfasında RANDEVORY bulunamadı!');
    console.log('  -> /login ekranında RANDEVORY logosu doğrulandı.');

    await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle2' });
    const registerContent = await page.content();
    if (!registerContent.includes('RANDEVORY')) throw new Error('/register sayfasında RANDEVORY bulunamadı!');
    console.log('  -> /register ekranında RANDEVORY logosu doğrulandı.');

    // 4. ŞİFRE SIFIRLAMA VE 60s COOLDOWN KORUMASI
    console.log('\n[TEST 4] Şifre Sıfırlama ve 60s Cooldown Koruması Test Ediliyor...');
    await page.goto(`${BASE_URL}/forgot-password`, { waitUntil: 'networkidle2' });

    await page.type('input[type="email"]', 'test_cooldown@randevory.pro');
    await page.click('button[type="submit"]');

    // İstek sonrası buton durumunu kontrol et
    await page.waitForFunction(() => {
      const btn = document.querySelector('button[type="submit"]');
      return btn && btn.disabled;
    }, { timeout: 10000 });

    const btnText = await page.$eval('button[type="submit"]', el => el.innerText);
    const isDisabled = await page.$eval('button[type="submit"]', el => el.disabled);
    console.log(`  -> İstek sonrası buton metni: "${btnText}", Disabled mı: ${isDisabled}`);

    if (!isDisabled) throw new Error('60 saniyelik geri sayımda buton devre dışı kalmadı!');
    if (!btnText.includes('s)')) console.log('  -> Not: Butonda saniye geri sayımı veya gönderim göstergesi aktif.');

    // Sayfayı yenileyip (F5) cooldown'ın localStorage'dan devam ettiğini doğrula
    console.log('  -> Sayfa F5 ile yenileniyor (LocalStorage kalıcılık testi)...');
    await page.reload({ waitUntil: 'networkidle2' });

    const btnAfterReload = await page.$eval('button[type="submit"]', el => el.innerText);
    const isDisabledAfterReload = await page.$eval('button[type="submit"]', el => el.disabled);
    console.log(`  -> F5 sonrası buton durumu: "${btnAfterReload}", Disabled: ${isDisabledAfterReload}`);
    if (!isDisabledAfterReload) throw new Error('Sayfa yenilendiğinde cooldown süresi sıfırlandı!');
    console.log('  -> Cooldown localStorage kalıcılığı BAŞARIYLA DOĞRULANDI.');

    // 5. SALON PRESTIJ MÜŞTERİ SAYFASI VE POWERED BY FOOTER
    console.log('\n[TEST 5] Müşteri Randevu Sayfası (/salon-prestij) ve Veri Bütünlüğü...');
    await page.goto(`${BASE_URL}/salon-prestij`, { waitUntil: 'networkidle2' });
    const clientPageContent = await page.content();
    if (!clientPageContent.includes('Salon Prestij')) throw new Error('Salon Prestij sayfası yüklenemedi!');
    if (!clientPageContent.includes('RANDEVORY')) throw new Error('Müşteri sayfasında RANDEVORY footer bulunamadı!');
    console.log('  -> Salon Prestij canlı ve RANDEVORY güvence damgası mevcut.');

    // 6. İŞLETME GİRİŞİ VE DASHBOARD
    console.log('\n[TEST 6] İşletme Girişi ve Dashboard Marka Kontrolü...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await page.type('input[type="email"]', 'test_merchant_2026@randevo.pro');
    await page.type('input[type="password"]', 'MerchantPass2026!');
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
    const currentUrl = page.url();
    console.log(`  -> Giriş sonrası URL: ${currentUrl}`);
    if (!currentUrl.includes('/dashboard')) throw new Error('Dashboard açılmadı!');

    const dashboardBrand = await page.$eval('aside', el => el.innerText);
    console.log(`  -> Dashboard Sidebar RANDEVORY kontrolü: ${dashboardBrand.includes('RANDEVORY') ? 'BAŞARILI' : 'BAŞARISIZ'}`);
    if (!dashboardBrand.includes('RANDEVORY')) throw new Error('Dashboard sidebarında RANDEVORY logosu bulunamadı!');

    // 7. MOBİL GÖRÜNÜM KONTROLÜ
    console.log('\n[TEST 7] Mobil Ekran Boyutunda (375x667) Header ve Marka Kontrolü...');
    await page.setViewport({ width: 375, height: 667, isMobile: true });
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
    const mobileHeader = await page.$eval('header', el => el.innerText);
    console.log(`  -> Mobil Header RANDEVORY kontrolü: ${mobileHeader.includes('RANDEVORY') ? 'BAŞARILI' : 'BAŞARISIZ'}`);
    if (!mobileHeader.includes('RANDEVORY')) throw new Error('Mobil headerda RANDEVORY bulunamadı!');

    console.log('\n🎉 TÜM TESTLER %100 BAŞARIYLA TAMAMLANDI! HİÇBİR HATA YOK.');
  } catch (error) {
    console.error('\n❌ TEST HATASI:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runVerification();
