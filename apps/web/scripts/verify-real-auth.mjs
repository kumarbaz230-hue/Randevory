import puppeteer from 'puppeteer-core';
import { createClient } from '@supabase/supabase-js';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';
const SUPABASE_URL = 'https://ysxwuiecybnsgbjbcfoa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzeHd1aWVjeWJuc2diamJjZm9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQwNTEyMDIsImV4cCI6MjEwOTYyNzIwMn0.FWA_qsBi-W585oUQnRqQK2BXLPe_poyrQIL1ziY80yI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('===============================================================');
console.log('    RANDEVO - TAM KULLANICI GİRİŞ, ONBOARDING & OTURUM TESTİ   ');
console.log('===============================================================\n');

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function verifyAuthFlow() {
  const testEmail = 'test_merchant_2026@randevo.pro';
  const testPassword = 'MerchantPass2026!';
  const bizName = `Gözde Salon ${Date.now().toString().slice(-4)}`;

  let browser = null;
  const results = {
    steps_passed: [],
    errors: [],
  };

  try {
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1280,800'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // ADIM 1: /login Sayfasını Aç ve Hatalı Parolayı Test Et
    console.log('[ADIM 1] /login sayfası açılıyor ve hatalı şifre kontrolü yapılıyor...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });

    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', testEmail);
    await page.type('input[placeholder="••••••••"]', 'YanlisSifre123!');
    await page.click('button[type="submit"]');

    await sleep(1500);
    const errorText = await page.$eval('.bg-rose-50', (el) => el.innerText).catch(() => '');
    console.log(' -> Hata uyarısı alındı:', errorText.replace(/\n/g, ' '));
    if (errorText.includes('hatalı') || errorText.includes('bilgilerinizi kontrol')) {
      results.steps_passed.push('1. Hatalı parola denemesinde Türkçe ve açıklayıcı hata mesajı gösterildi');
    } else {
      throw new Error(`Beklenen hata mesajı görüntülenemedi: ${errorText}`);
    }

    // ADIM 2: Doğru Bilgilerle Giriş Yap
    console.log('\n[ADIM 2] Doğru şifre ile giriş yapılıyor...');
    await page.click('input[type="email"]', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('input[type="email"]', testEmail);

    await page.click('input[placeholder="••••••••"]', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('input[placeholder="••••••••"]', testPassword);

    await page.click('button[type="submit"]');
    console.log(' -> Giriş butonuna tıklandı, yönlendirme bekleniyor...');

    // Wait for navigation
    await sleep(3000);
    const postLoginUrl = page.url();
    console.log(' -> Giriş sonrası URL:', postLoginUrl);

    // Yeni kullanıcı olduğu için henüz işletmesi yok, bu yüzden /create-business açılmalı!
    if (postLoginUrl.includes('/create-business')) {
      console.log(' -> [✓] Başarılı! İşletmesi olmayan yeni kullanıcı doğrudan /create-business sayfasına aktarıldı.');
      results.steps_passed.push('2. İşletmesi olmayan yeni kullanıcının otomatik /create-business sayfasına yönlendirilmesi');
    } else if (postLoginUrl.includes('/dashboard')) {
      console.log(' -> [✓] Kullanıcı /dashboard sayfasına yönlendirildi.');
      results.steps_passed.push('2. Kullanıcı başarılı giriş yaparak yönetim paneline ulaştı');
    } else {
      throw new Error(`Beklenmeyen yönlendirme URL'i: ${postLoginUrl}`);
    }

    // ADIM 3: Yeni İşletme Kurulumunu Tamamla
    if (page.url().includes('/create-business')) {
      console.log('\n[ADIM 3] Yeni işletme formu dolduruluyor ve kaydediliyor...');
      await page.waitForSelector('input[placeholder*="Örn: Star Kuaför"]');
      await page.type('input[placeholder*="Örn: Star Kuaför"]', bizName);
      await page.type('input[placeholder*="0212"]', '02164445566');
      await page.type('input[placeholder*="Mahalle"]', 'Bağdat Cad. No: 120');

      await page.click('button[type="submit"]');
      console.log(' -> "İşletme Profilini Oluştur" butonuna tıklandı...');
      await sleep(3500);

      console.log(' -> İşletme kaydı sonrası URL:', page.url());
      if (page.url().includes('/dashboard')) {
        console.log(` -> [✓] İşletme ("${bizName}") oluşturuldu ve Dashboard'a geçildi!`);
        results.steps_passed.push(`3. Yeni işletme onboarding formu ve üyelik kurulumu ("${bizName}")`);
      } else {
        throw new Error(`İşletme oluşturma sonrası /dashboard sayfasına ulaşılamadı. Güncel URL: ${page.url()}`);
      }
    }

    // ADIM 4: Dashboard ve Cookie Oturum Kalıcılığı Testi (Sayfa Yenileme / F5)
    console.log('\n[ADIM 4] Sayfa yenileniyor (F5 - Cookie & Session Kalıcılık Testi)...');
    await page.reload({ waitUntil: 'networkidle2' });
    await sleep(2000);

    const reloadedUrl = page.url();
    console.log(' -> Yenileme sonrası URL:', reloadedUrl);

    if (reloadedUrl.includes('/dashboard')) {
      console.log(' -> [✓] BAŞARILI! Oturum çerezleri (cookies) ve middleware oturumu korudu.');
      results.steps_passed.push('4. Sayfa yenilendiğinde (F5) oturumun ve çerezlerin güvenle korunması');
    } else {
      throw new Error(`Sayfa yenilendikten sonra oturum düştü! URL: ${reloadedUrl}`);
    }

    // Aktif işletme adının sidebar'da görüntülendiğini doğrula
    const pageContent = await page.content();
    if (pageContent.includes(bizName)) {
      console.log(` -> [✓] Sidebar üzerinde yeni aktif işletme adı ("${bizName}") başarıyla görüntülendi.`);
      results.steps_passed.push(`5. Aktif işletme adının panelde doğru şekilde senkronize edilmesi`);
    }

    // ADIM 5: Çıkış Yapma (Logout)
    console.log('\n[ADIM 5] Hesaptan güvenli çıkış yapılıyor...');
    const logoutBtn = await page.$('button[title="Çıkış Yap"]');
    if (logoutBtn) {
      await logoutBtn.click();
      await sleep(2000);
      console.log(' -> Çıkış sonrası URL:', page.url());
      if (page.url().includes('/login')) {
        console.log(' -> [✓] Güvenli çıkış yapıldı ve /login ekranına dönüldü.');
        results.steps_passed.push('6. Güvenli oturum kapatma (Logout) ve /login yönlendirmesi');
      }
    }

    // ADIM 6: Artık İşletmesi Olan Hesapla Tekrar Giriş Yap
    console.log('\n[ADIM 6] Aynı hesapla tekrar giriş yapılıyor (Artık işletmesi olduğu için doğrudan /dashboard açılmalı)...');
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', testEmail);
    await page.type('input[placeholder="••••••••"]', testPassword);
    await page.click('button[type="submit"]');
    await sleep(2500);

    const secondLoginUrl = page.url();
    console.log(' -> İkinci giriş sonrası URL:', secondLoginUrl);
    if (secondLoginUrl.includes('/dashboard')) {
      console.log(' -> [✓] BAŞARILI! İşletmesi mevcut olduğu için doğrudan /dashboard açıldı!');
      results.steps_passed.push('7. Mevcut işletme sahibinin doğrudan /dashboard ekranına yönlendirilmesi');
    } else {
      throw new Error(`İkinci giriş sonrası /dashboard beklenirken farklı URL açıldı: ${secondLoginUrl}`);
    }

  } catch (err) {
    console.error('TEST BAŞARISIZ OLDU:', err.message);
    results.errors.push(err.message);
  } finally {
    if (browser) {
      await browser.close();
      console.log('\n[CHROME] Tarayıcı kapatıldı.');
    }
  }

  console.log('\n===============================================================');
  console.log('                   DOĞRULAMA TEST RAPORU                       ');
  console.log('===============================================================');
  console.log(`BAŞARILI ADIMLAR (${results.steps_passed.length}):`);
  results.steps_passed.forEach((s) => console.log(` [✓] ${s}`));

  if (results.errors.length > 0) {
    console.log(`\nHATALAR (${results.errors.length}):`);
    results.errors.forEach((e) => console.log(` [✗] ${e}`));
  } else {
    console.log('\nHATALAR: 0 (Tüm kimlik doğrulama, onboarding ve oturum senaryoları %100 başarılı)');
  }
}

verifyAuthFlow();
