import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const targetDirs = [
  'C:\\Users\\kumar\\OneDrive\\Desktop\\Shopier-Paketler',
  'C:\\Users\\kumar\\Desktop\\Shopier-Paketler'
];

for (const dir of targetDirs) {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (e) {
    // ignore if one desktop doesn't exist
  }
}

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const plans = [
  {
    fileName: '1-Standart-Paket.png',
    title: 'STANDART PAKET',
    subtitle: 'Büyüyen İşletmeler & Butik Salonlar İçin',
    tag: 'BAŞLANGIÇ ADIMI',
    tagBg: 'from-emerald-500 to-teal-600',
    glowColor: 'rgba(16, 185, 129, 0.35)',
    accentGradient: 'from-emerald-400 via-teal-300 to-cyan-400',
    price: '149 ₺',
    priceCycle: 'aylık',
    yearlyPrice: 'veya yıllık tek çekim 1.290 ₺ (aylık ~107 ₺)',
    features: [
      { icon: '👥', text: '<strong>3 Personel</strong> Yönetimi' },
      { icon: '✂️', text: '<strong>20 Farklı Hizmet</strong> Tanımı' },
      { icon: '🗓️', text: 'Aylık <strong>300 Randevu</strong> Kapasitesi' },
      { icon: '📱', text: 'Otomatik <strong>SMS & E-posta</strong> Hatırlatma' },
      { icon: '📍', text: 'Canlı Konum & Google Haritalar Yol Tarifi' },
      { icon: '🔗', text: 'Özel İşletme Linki & Masa QR Kodu' },
      { icon: '💬', text: 'Müşteri Canlı Mesajlaşma Modülü' },
      { icon: '⚡', text: 'Standart Teknik Destek' },
    ],
  },
  {
    fileName: '2-Profesyonel-Paket.png',
    title: 'PROFESYONEL PAKET',
    subtitle: 'Yoğun Randevulu Merkezler & Kuaförler İçin',
    tag: '🔥 EN ÇOK TERCİH EDİLEN',
    tagBg: 'from-brand-600 via-indigo-600 to-blue-500',
    glowColor: 'rgba(99, 102, 241, 0.45)',
    accentGradient: 'from-blue-400 via-indigo-300 to-purple-400',
    price: '299 ₺',
    priceCycle: 'aylık',
    yearlyPrice: 'veya yıllık tek çekim 2.690 ₺ (aylık ~224 ₺)',
    featured: true,
    features: [
      { icon: '👥', text: '<strong>10 Personel</strong> Tam Ekip Yönetimi' },
      { icon: '✂️', text: '<strong>100 Hizmet</strong> ve Fiyat Tanımı' },
      { icon: '🗓️', text: 'Aylık <strong>1.500 Randevu</strong> Kapasitesi' },
      { icon: '📊', text: 'Gelişmiş <strong>Finans, Gelir & Ciro Raporları</strong>' },
      { icon: '🏢', text: 'Çoklu Şube & Ekip İzin Yönetimi' },
      { icon: '⭐', text: 'Müşteri <strong>Puanlama & Yorum (Google / Web)</strong>' },
      { icon: '🔔', text: 'Sesli & Titreşimli Canlı Telefon Bildirimleri' },
      { icon: '🚀', text: '<strong>7/24 Öncelikli</strong> Canlı Teknik Destek' },
    ],
  },
  {
    fileName: '3-Kurumsal-Paket.png',
    title: 'KURUMSAL PAKET',
    subtitle: 'Zincir Şubeler, Klinikler & Büyük Merkezler',
    tag: '👑 VIP KURUMSAL SÜRÜM',
    tagBg: 'from-amber-500 via-rose-500 to-purple-600',
    glowColor: 'rgba(245, 158, 11, 0.35)',
    accentGradient: 'from-amber-300 via-orange-300 to-rose-400',
    price: '599 ₺',
    priceCycle: 'aylık',
    yearlyPrice: 'veya yıllık tek çekim 5.490 ₺ (aylık ~457 ₺)',
    features: [
      { icon: '♾️', text: '<strong>SINIRSIZ</strong> Personel Hesabı' },
      { icon: '♾️', text: '<strong>SINIRSIZ</strong> Hizmet & Kategori Tanımı' },
      { icon: '♾️', text: '<strong>SINIRSIZ</strong> Randevu Kotası' },
      { icon: '🌐', text: 'Özel Alan Adı (Custom Domain) Entegrasyonu' },
      { icon: '🔗', text: 'Özel Webhook & <strong>VIP API Erişimi</strong>' },
      { icon: '👔', text: '<strong>Özel Müşteri Temsilcisi</strong> & Hızlı Destek' },
      { icon: '🛡️', text: '%99.9 Kesintisiz Hizmet Güvencesi (SLA)' },
      { icon: '💎', text: 'Kurumsal Marka ve Özel Raporlama' },
    ],
  },
];

function generateHtml(p) {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1200px;
      height: 1200px;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #090d16;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }
    
    /* Background decorative ambient lights */
    .bg-glow-1 {
      position: absolute;
      width: 800px;
      height: 800px;
      border-radius: 50%;
      background: radial-gradient(circle, ${p.glowColor} 0%, rgba(0,0,0,0) 70%);
      top: -200px;
      right: -200px;
      filter: blur(80px);
    }
    .bg-glow-2 {
      position: absolute;
      width: 600px;
      height: 600px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, rgba(0,0,0,0) 70%);
      bottom: -150px;
      left: -150px;
      filter: blur(80px);
    }
    .grid-lines {
      position: absolute;
      inset: 0;
      background-image: 
        linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
      background-size: 60px 60px;
    }

    /* Container Card */
    .card {
      position: relative;
      z-index: 10;
      width: 1040px;
      height: 1040px;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(40px);
      border-radius: 44px;
      border: 2px solid rgba(255, 255, 255, 0.12);
      box-shadow: 0 40px 100px -20px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.2);
      padding: 60px 70px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand-group {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .brand-icon {
      width: 60px;
      height: 60px;
      border-radius: 18px;
      background: linear-gradient(135deg, #2563eb, #4f46e5);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      font-weight: 900;
      box-shadow: 0 12px 30px rgba(37, 99, 235, 0.4);
    }
    .brand-text {
      font-size: 36px;
      font-weight: 900;
      letter-spacing: -1px;
    }
    .brand-sub {
      font-size: 13px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-top: 2px;
    }
    .tag-badge {
      background: linear-gradient(135deg, ${p.tagBg});
      padding: 10px 24px;
      border-radius: 100px;
      font-size: 14px;
      font-weight: 800;
      letter-spacing: 1px;
      text-transform: uppercase;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      border: 1px solid rgba(255, 255, 255, 0.25);
    }

    /* Main Title & Price Block */
    .title-block {
      margin-top: 36px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-bottom: 2px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 36px;
    }
    .plan-title {
      font-size: 54px;
      font-weight: 900;
      letter-spacing: -1.5px;
      line-height: 1.1;
      background: linear-gradient(135deg, #ffffff 40%, #94a3b8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .plan-sub {
      font-size: 19px;
      color: #94a3b8;
      font-weight: 600;
      margin-top: 10px;
    }

    .price-box {
      text-align: right;
    }
    .price-val {
      font-size: 64px;
      font-weight: 900;
      line-height: 1;
      color: #ffffff;
    }
    .price-cycle {
      font-size: 16px;
      font-weight: 700;
      color: #94a3b8;
      margin-top: 4px;
    }
    .price-yearly {
      font-size: 14px;
      font-weight: 700;
      color: #10b981;
      margin-top: 4px;
    }

    /* Features Grid */
    .features-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px 36px;
      margin-top: 36px;
    }
    .feature-item {
      display: flex;
      align-items: center;
      gap: 16px;
      background: rgba(255, 255, 255, 0.04);
      padding: 16px 20px;
      border-radius: 18px;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }
    .feature-icon {
      font-size: 24px;
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      shrink-0;
    }
    .feature-text {
      font-size: 17px;
      color: #e2e8f0;
      font-weight: 500;
      line-height: 1.35;
    }
    .feature-text strong {
      color: #ffffff;
      font-weight: 800;
    }

    /* Footer Trust Banner */
    .footer-bar {
      margin-top: 36px;
      padding-top: 24px;
      border-top: 2px solid rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .trust-pill {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      font-weight: 700;
      color: #94a3b8;
    }
    .trust-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 12px #10b981;
    }
    .shopier-logo-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(255, 255, 255, 0.08);
      padding: 8px 18px;
      border-radius: 100px;
      font-size: 13px;
      font-weight: 800;
      color: #cbd5e1;
    }
  </style>
</head>
<body>
  <div class="bg-glow-1"></div>
  <div class="bg-glow-2"></div>
  <div class="grid-lines"></div>

  <div class="card">
    <div class="header">
      <div class="brand-group">
        <div class="brand-icon">R</div>
        <div>
          <div class="brand-text">RANDE<span style="color:#6366f1;">VORY</span></div>
          <div class="brand-sub">Yeni Nesil Randevu Platformu</div>
        </div>
      </div>
      <div class="tag-badge">${p.tag}</div>
    </div>

    <div class="title-block">
      <div>
        <h1 class="plan-title">${p.title}</h1>
        <p class="plan-sub">${p.subtitle}</p>
      </div>
      <div class="price-box">
        <div class="price-val">${p.price}</div>
        <div class="price-cycle">/ ${p.priceCycle}</div>
        <div class="price-yearly">${p.yearlyPrice}</div>
      </div>
    </div>

    <div class="features-grid">
      ${p.features.map(f => `
        <div class="feature-item">
          <div class="feature-icon">${f.icon}</div>
          <div class="feature-text">${f.text}</div>
        </div>
      `).join('')}
    </div>

    <div class="footer-bar">
      <div class="trust-pill">
        <div class="trust-dot"></div>
        <span>Anında Dijital Teslimat • Taahhütsüz Kullanım</span>
      </div>
      <div class="shopier-logo-badge">
        <span>🔒 Shopier 3D Secure Güvencesiyle</span>
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function renderBanners() {
  console.log('Starting banner rendering with Chrome...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  try {
    for (const plan of plans) {
      console.log('Rendering:', plan.fileName);
      const page = await browser.newPage();
      await page.setViewport({ width: 1200, height: 1200, deviceScaleFactor: 1 });
      const html = generateHtml(plan);
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      for (const dir of targetDirs) {
        try {
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          const outPath = path.join(dir, plan.fileName);
          await page.screenshot({ path: outPath, type: 'png' });
          console.log('Saved to:', outPath);
        } catch (err) {
          console.error(`Could not write to ${dir}:`, err.message);
        }
      }
      await page.close();
    }
    console.log('All 3 banners generated successfully on Desktop!');
  } finally {
    await browser.close();
  }
}

renderBanners().catch(console.error);
