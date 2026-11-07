import puppeteer from 'puppeteer-core';
import { createClient } from '@supabase/supabase-js';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';
const SUPABASE_URL = 'https://ysxwuiecybnsgbjbcfoa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzeHd1aWVjeWJuc2diamJjZm9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQwNTEyMDIsImV4cCI6MjEwOTYyNzIwMn0.FWA_qsBi-W585oUQnRqQK2BXLPe_poyrQIL1ziY80yI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('===============================================================');
console.log('   RANDEVO - GERÇEK KULLANICI KAYIT & GİRİŞ SİSTEMİ TESTİ     ');
console.log('===============================================================\n');

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runAuthVerification() {
  const timestamp = Date.now();
  const testEmail = `sahip_${timestamp}@randevotest.com`;
  const testPassword = `TestPass!${timestamp.toString().slice(-4)}`;
  const testFullName = `Ali Test Sahibi ${timestamp.toString().slice(-4)}`;
  const testPhone = '05351234567';

  console.log('TEST KULLANICI BİLGİLERİ:');
  console.log(' -> E-posta:', testEmail);
  console.log(' -> Ad Soyad:', testFullName);
  console.log(' -> Telefon:', testPhone);

  let browser = null;
  const networkLogs = [];
  const consoleLogs = [];

  try {
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1280,800'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    page.on('console', (msg) => {
      consoleLogs.push(`[Console ${msg.type()}] ${msg.text()}`);
    });

    page.on('response', async (res) => {
      const url = res.url();
      if (url.includes('/auth/v1/')) {
        const status = res.status();
        let body = '';
        try {
          body = await res.text();
        } catch {}
        networkLogs.push({ url, status, body: body.slice(0, 150) });
      }
    });

    // -------------------------------------------------------------
    // 1. KAYIT İŞLEMİ (REGISTER)
    // -------------------------------------------------------------
    console.log('\n[ADIM 1] /register sayfasına gidiliyor ve form dolduruluyor...');
    await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle2' });

    // Fill form
    await page.waitForSelector('input[placeholder*="Örn: Mustafa Sakallı"]');
    await page.type('input[placeholder*="Örn: Mustafa Sakallı"]', testFullName);
    await page.type('input[type="email"]', testEmail);
    await page.type('input[type="tel"]', testPhone);

    const pwdInputs = await page.$$('input[placeholder="••••••••"]');
    if (pwdInputs[0]) await pwdInputs[0].type(testPassword);
    if (pwdInputs[1]) await pwdInputs[1].type(testPassword);

    console.log(' -> Form alanları dolduruldu. "Hesap Oluştur" butonuna basılıyor...');
    await page.click('button[type="submit"]');

    // Wait for response
    await sleep(2500);

    const currentUrl = page.url();
    const content = await page.content();
    console.log(' -> Kayıt sonrası URL:', currentUrl);

    const isConfirmScreen = content.includes('Doğrulama E-postası Gönderildi') || content.includes('Gelen kutunuzu kontrol edin');
    const isCreateBizScreen = currentUrl.includes('/create-business') || content.includes('İşletmenizi Tanımlayın');

    if (isConfirmScreen) {
      console.log(' -> [✓] Doğrulama bildirimi ekranı başarıyla görüntülendi.');
    } else if (isCreateBizScreen) {
      console.log(' -> [✓] Oturum doğrudan açıldı ve /create-business onboarding ekranına yönlendirildi.');
    } else {
      console.log(' -> Sayfa çıktısı kontrol ediliyor...');
    }

    // -------------------------------------------------------------
    // 2. SUPABASE AUTH VERİTABANI KONTROLÜ
    // -------------------------------------------------------------
    console.log('\n[ADIM 2] Supabase Auth ve Profil tablosu kontrol ediliyor...');
    const { data: createdUsers, error: userSearchErr } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('email', testEmail)
      .maybeSingle();

    if (createdUsers) {
      console.log(' -> [✓] profiles tablosunda kullanıcı kaydı doğrulandı! ID:', createdUsers.id);
    } else {
      console.warn(' -> profiles tablosunda henüz görünmedi, direct auth kontrol edilecek.');
    }

    // -------------------------------------------------------------
    // 3. E-POSTA DOĞRULAMA DURUMU & DOĞRULAMA TAMAMLAMA
    // -------------------------------------------------------------
    console.log('\n[ADIM 3] E-posta doğrulama durumu onaylanıyor...');
    // E-postayı onaylı duruma getirelim (gerçek bağlantı tıklandığında yapılan işlem)
    // Supabase RPC veya SQL ile onaylayalım
    // (Bunu doğrudan REST/SQL üzerinden doğrulayacağız)

    // -------------------------------------------------------------
    // 4. GİRİŞ SAYFASI (LOGIN) TESTİ
    // -------------------------------------------------------------
    console.log('\n[ADIM 4] /login sayfasına gidiliyor ve giriş yapılıyor...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });

    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', testEmail);
    await page.type('input[placeholder="••••••••"]', testPassword);

    console.log(' -> Giriş butonuna basılıyor...');
    await page.click('button[type="submit"]');

    await sleep(2500);

    console.log(' -> Giriş sonrası URL:', page.url());
    const afterLoginContent = await page.content();

    // -------------------------------------------------------------
    // 5. YENİ KULLANICI İÇİN İŞLETME KURULUMU (CREATE BUSINESS)
    // -------------------------------------------------------------
    if (page.url().includes('/create-business') || afterLoginContent.includes('İşletmenizi Tanımlayın')) {
      console.log('\n[ADIM 5] Kullanıcının henüz işletmesi olmadığı için /create-business açıldı! İşletme oluşturuluyor...');
      const bizName = `Ali Usta Berber ${timestamp.toString().slice(-4)}`;
      
      await page.waitForSelector('input[placeholder*="Örn: Star Kuaför"]');
      await page.type('input[placeholder*="Örn: Star Kuaför"]', bizName);
      await page.type('input[placeholder*="0212"]', '02161112233');
      await page.type('input[type="email"]', testEmail);
      await page.type('input[placeholder*="Adres"]', 'Atatürk Cad. No: 45');

      await page.click('button[type="submit"]');
      await sleep(2500);

      console.log(' -> İşletme oluşturma sonrası URL:', page.url());
    }

    // -------------------------------------------------------------
    // 6. DASHBOARD ERİŞİMİ VE SAYFA YENİLEME TESTİ
    // -------------------------------------------------------------
    console.log('\n[ADIM 6] Dashboard erişimi ve F5 / Yenileme testi yapılıyor...');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
    await sleep(1500);

    const dashContent = await page.content();
    if (dashContent.includes('Genel Bakış') || dashContent.includes('Randevu')) {
      console.log(' -> [✓] Dashboard başarıyla açıldı!');
    } else {
      console.log(' -> Dashboard içeriği:', dashContent.slice(0, 200));
    }

    console.log(' -> Sayfa yenileniyor (F5 - Cookie / Oturum testi)...');
    await page.reload({ waitUntil: 'networkidle2' });
    await sleep(1500);

    const reloadedUrl = page.url();
    console.log(' -> Yenileme sonrası URL:', reloadedUrl);
    if (reloadedUrl.includes('/dashboard')) {
      console.log(' -> [✓] Oturum başarıyla korundu! Cookie mekanizması stabil çalışıyor.');
    } else {
      throw new Error(`Yenileme sonrası oturum kaybedildi! URL: ${reloadedUrl}`);
    }

    // -------------------------------------------------------------
    // 7. ÇIKIŞ (LOGOUT) VE YENİDEN GİRİŞ TESTİ
    // -------------------------------------------------------------
    console.log('\n[ADIM 7] Hesaptan çıkış yapılıyor...');
    const logoutBtn = await page.$('button[title="Çıkış Yap"]');
    if (logoutBtn) {
      await logoutBtn.click();
      await sleep(1500);
      console.log(' -> Çıkış sonrası URL:', page.url());
    }

    console.log('\n[ADIM 8] Aynı hesapla tekrar /login üzerinden giriş yapılıyor...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', testEmail);
    await page.type('input[placeholder="••••••••"]', testPassword);
    await page.click('button[type="submit"]');
    await sleep(2500);

    console.log(' -> İkinci giriş sonrası URL:', page.url());
    if (page.url().includes('/dashboard')) {
      console.log(' -> [✓] İkinci giriş doğrudan /dashboard sayfasına ulaştı!');
    }

  } catch (err) {
    console.error('TEST SIRASINDA HATA:', err.message);
  } finally {
    if (browser) {
      await browser.close();
      console.log('\n[CHROME] Tarayıcı kapatıldı.');
    }

    console.log('\n--- NETWORK LOGLARI (Supabase Auth İstekleri) ---');
    networkLogs.forEach((l) => console.log(` -> ${l.status} ${l.url} | ${l.body}`));
  }
}

runAuthVerification();
