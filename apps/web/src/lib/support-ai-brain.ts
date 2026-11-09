/**
 * RANDEVORY AI Support Brain
 * 7/24 Kesin Çözüm Üreten Yapay Zeka Destek Motoru
 */

export interface AiResolution {
  category: 'auth' | 'booking' | 'tables' | 'calendar' | 'services' | 'security' | 'billing' | 'pwa' | 'general';
  title: string;
  solution: string;
  quickActions: Array<{ id: string; label: string; url?: string }>;
}

export function solveSupportQuery(userText: string): AiResolution {
  const q = userText.toLowerCase().trim();

  // 1. Şifre, Giriş, Parola Sorunları
  if (
    q.includes('şifre') ||
    q.includes('sifre') ||
    q.includes('giriş') ||
    q.includes('giris') ||
    q.includes('parola') ||
    q.includes('login') ||
    q.includes('hesabıma giremiyorum')
  ) {
    return {
      category: 'auth',
      title: '🔑 Şifre Sıfırlama & Giriş Çözümü',
      solution:
        `Giriş ve şifre sorununu hemen 2 adımda çözebilirsiniz:\n\n` +
        `1. **Şifremi Unuttum Ekranı:** Giriş sayfasında (/login) bulunan **"Şifremi Unuttum"** bağlantısına tıklayın ve kayıtlı e-postanızı yazın.\n` +
        `2. **Sıfırlama Bağlantısı:** 1 dakika içinde e-posta kutunuza (Spam/Gereksiz klasörünü de kontrol edin) yeni şifre oluşturma linki gelecektir.\n\n` +
        `💡 *Eğer e-posta gelmiyorsa veya kayıtlı e-postanızı hatırlamıyorsanız, destek talebinize e-posta adresinizi yazın; yetkili arkadaşımız hesabınızı doğrudan güncelleyecektir.*`,
      quickActions: [
        { id: 'act_login', label: 'Giriş Ekranına Git', url: '/login' },
        { id: 'act_forgot', label: 'Şifre Sıfırlama Sayfası', url: '/forgot-password' },
      ],
    };
  }

  // 2. Masa & Mekan Rezervasyonu (2. Stil) Soruları
  if (
    q.includes('masa') ||
    q.includes('restoran') ||
    q.includes('kafe') ||
    q.includes('loca') ||
    q.includes('bahçe') ||
    q.includes('bahce') ||
    q.includes('teras') ||
    q.includes('salon') ||
    q.includes('2. stil')
  ) {
    return {
      category: 'tables',
      title: '🍽️ Masa & Mekan Rezervasyonu Çözümü',
      solution:
        `Masa ve mekan rezervasyonu sistemi (2. Stil) hakkında bilmeniz gerekenler:\n\n` +
        `1. **Masa Düzenini Açma/Kapatma:** İşletme Tablonuzda sol menüdeki **"Masalar & Alanlar"** sekmesine gidin. En üstteki **"Masa Rezervasyon Sistemini Aktif Et"** butonuna basarak anında açıp kapatabilirsiniz.\n` +
        `2. **Bölüm & Masa Yönetimi:** Bahçe, Ana Salon, Teras ve VIP Loca bölümlerine istediğiniz kadar masa ekleyebilir, kişi kapasitelerini (2, 4, 8 kişi) ve özelliklerini (Prizli, Klimalı vb.) belirleyebilirsiniz.\n` +
        `3. **Varsayılan Görünüm:** Kafe veya restoran iseniz, sayfanız açıldığında doğrudan interaktif masa haritasının açılmasını seçebilirsiniz.\n` +
        `4. **Canlı Önizleme:** "Masa Sayfasını Canlı Gör" butonuna tıklayarak müşterilerinizin masaları nasıl gördüğünü hemen test edebilirsiniz.`,
      quickActions: [
        { id: 'act_tables', label: 'Masalar & Alanlar Sayfasına Git', url: '/dashboard/tables' },
        { id: 'act_settings', label: 'İşletme Ayarları', url: '/dashboard/settings' },
      ],
    };
  }

  // 3. Randevu İptali / Sorgulama
  if (
    q.includes('iptal') ||
    q.includes('vazgeç') ||
    q.includes('randevumu sil') ||
    q.includes('sorgula') ||
    q.includes('saat değiştir')
  ) {
    return {
      category: 'booking',
      title: '📅 Randevu İptali & Değişiklik Çözümü',
      solution:
        `Randevu iptali ve sorgulama işlemleri son derece basittir:\n\n` +
        `• **Müşteriler İçin:** Randevu aldığınız işletmenin profil sayfasına gidin (/isletme-adiniz). Üstteki **"Randevu Sorgula / İptal"** sekmesine tıklayıp telefon numaranızı girin; mevcut randevunuzu tek tuşla iptal edebilirsiniz.\n` +
        `• **İşletmeler İçin:** İşletme Tablonuzdaki **"Randevular"** veya **"Randevu Takvimi"** sayfasından istediğiniz randevunun üzerine tıklayıp kırmızı **"İptal"** veya **"Gelmedi (No-Show)"** butonuna basabilirsiniz.\n\n` +
        `İptal edilen randevunun saati anında takvimde boşa çıkar ve başka müşteriler randevu alabilir.`,
      quickActions: [
        { id: 'act_calendar', label: 'Randevu Takvimine Git', url: '/dashboard/calendar' },
        { id: 'act_dashboard', label: 'İşletme Tablosuna Git', url: '/dashboard' },
      ],
    };
  }

  // 4. Takvimde Saat Çıkmaması / Saatlerin Kapalı Olması
  if (
    q.includes('saat') ||
    q.includes('takvim') ||
    q.includes('müsait') ||
    q.includes('musait') ||
    q.includes('boş saat yok') ||
    q.includes('saat görünmüyor') ||
    q.includes('slot')
  ) {
    return {
      category: 'calendar',
      title: '⏰ Takvimde Randevu Saatlerinin Görünmesi Çözümü',
      solution:
        `Sayfanızda randevu saatleri çıkmıyorsa veya kapalı görünüyorsa 3 adımı kontrol edin:\n\n` +
        `1. **Çalışma Saatleri:** İşletme Ayarları > Çalışma Saatleri sekmesinde ilgili günün (Pzt, Salı vb.) **"Açık"** olduğundan ve saat aralığının (örn: 09:00 - 19:00) doğru girildiğinden emin olun.\n` +
        `2. **Personel Eşleşmesi:** Personel Yönetimi menüsünde en az 1 çalışanınızın o gün çalıştığından ve sunduğunuz **hizmetlerle eşleştiğinden** emin olun.\n` +
        `3. **Slot Aralığı:** İşletme Ayarları sayfasından slot aralığını (15, 20, 30, 45, 60 dk) dilediğiniz gibi değiştirebilirsiniz.`,
      quickActions: [
        { id: 'act_settings_hours', label: 'Çalışma Saatlerini Düzenle', url: '/dashboard/settings' },
        { id: 'act_staff', label: 'Personel Yönetimi', url: '/dashboard/staff' },
      ],
    };
  }

  // 5. Hizmet Süresi (90 Dakika vb.) & Fiyat Düzenleme
  if (
    q.includes('süre') ||
    q.includes('dakika') ||
    q.includes('90') ||
    q.includes('fiyat') ||
    q.includes('hizmet ekle') ||
    q.includes('ücret')
  ) {
    return {
      category: 'services',
      title: '✨ Hizmet Süresi & Fiyat Ayarları Çözümü',
      solution:
        `Hizmetlerin süresi ve fiyatları tam istediğiniz gibi özelleştirilebilir:\n\n` +
        `1. **Hizmetler & Fiyatlar** (/dashboard/services) sayfasına gidin.\n` +
        `2. Düzenlemek istediğiniz hizmetin yanındaki **Düzenle (Kalem)** butonuna tıklayın.\n` +
        `3. **Süre Seçimi:** Artık Saat (0-23) ve Dakika (0-59) alanları üzerinden **15 dk, 30 dk, 45 dk, 1 sa, 1 sa 30 dk (90 dk), 2 sa** gibi her türlü süreyi tam küsuratıyla belirleyebilirsiniz.\n` +
        `4. Fiyatınızı yazıp **Kaydet** butonuna basın. Sayfanızda anında güncellenir.`,
      quickActions: [
        { id: 'act_services', label: 'Hizmetler & Fiyatlar Sayfasına Git', url: '/dashboard/services' },
      ],
    };
  }

  // 6. Troll / Sahte Randevu / Gelmeyen Müşteri (No-Show) Koruması
  if (
    q.includes('gelmedi') ||
    q.includes('troll') ||
    q.includes('sahte') ||
    q.includes('kara liste') ||
    q.includes('engelle') ||
    q.includes('spam') ||
    q.includes('no-show')
  ) {
    return {
      category: 'security',
      title: '🛡️ Troll, Sahte Randevu & No-Show Koruması Çözümü',
      solution:
        `İşletmenizi trollüklerden ve gelmeyen müşterilerden korumak için 3 kalkan devrededir:\n\n` +
        `1. **Kara Liste / Numarayı Engelleme:** **Müşteriler (CRM)** sekmesine gidip randevusuna gelmeyen veya sahte işlem yapan kişinin yanındaki kırmızı **"🚫 Engelle"** butonuna basın. Bu numara bir daha işletmenizden asla randevu alamaz.\n` +
        `2. **No-Show İşaretleme:** Randevular sayfasında gelmeyen müşterilerin randevusunu tek tıkla **"Gelmedi"** olarak işaretleyebilirsiniz. Sistem o müşterinin kaç kez gelmediğini CRM tablonuzda otomatik sayar.\n` +
        `3. **Spam & Güvenlik Kodu Doğrulaması:** Aynı numara aynı günde en fazla 2 randevu alabilir ve müşteriler randevu alırken 4 haneli güvenlik kodunu onaylar; böylece botlar ve troller %100 engellenir.`,
      quickActions: [
        { id: 'act_customers', label: 'Müşteriler & Kara Liste Sayfası', url: '/dashboard/customers' },
        { id: 'act_appointments', label: 'Randevuları Görüntüle', url: '/dashboard' },
      ],
    };
  }

  // 7. İşletme Linki / Profil Açılmıyor / 404 Hatası
  if (
    q.includes('link') ||
    q.includes('bağlantı') ||
    q.includes('baglanti') ||
    q.includes('açılmıyor') ||
    q.includes('acilmiyor') ||
    q.includes('404') ||
    q.includes('bulunamadı') ||
    q.includes('instagram')
  ) {
    return {
      category: 'general',
      title: '🔗 İşletme Randevu Linki Çözümü',
      solution:
        `İşletmenizin müşterilere vereceği özel bağlantı hakkında çözüm adımları:\n\n` +
        `1. **Özel Linkinizi Kontrol Edin:** İşletme Tablonuzdaki **"İşletme Ayarları"** sayfasına gidin. Orada dükkanınızın web adresi yazar (Örn: *randevory.pro/isletme-adiniz*).\n` +
        `2. **Otomatik Onarım:** Türkçe karakterler (ş, ı, ğ, ç vb.) linkte otomatik düzeltilir. Eğer açılmıyorsa linkinizi sadece küçük harf ve tire kullanarak kaydedin (Örn: *mustafa-kuafor*).\n` +
        `3. **Instagram & WhatsApp:** Bu linki Instagram profilinizin "Biyografi / Bağlantılar" kısmına veya WhatsApp İşletme profilinize ekleyerek müşterilerinizin 7/24 randevu almasını sağlayabilirsiniz.`,
      quickActions: [
        { id: 'act_settings_slug', label: 'İşletme Ayarlarına Git', url: '/dashboard/settings' },
      ],
    };
  }

  // 8. Paketler, Ücret & Shopier Kart ile Ödeme
  if (
    q.includes('paket') ||
    q.includes('ücret') ||
    q.includes('ucret') ||
    q.includes('fiyat') ||
    q.includes('shopier') ||
    q.includes('kart') ||
    q.includes('ödeme') ||
    q.includes('odeme') ||
    q.includes('abonelik') ||
    q.includes('lisans')
  ) {
    return {
      category: 'billing',
      title: '💳 Abonelik, Paketler & Güvenli Ödeme Çözümü',
      solution:
        `RANDEVORY lisans paketleri taahhütsüz ve anında aktiftir:\n\n` +
        `1. **Paket Seçimi:** İşletme Tablosundaki **"Abonelik & Lisans"** (/dashboard/billing) menüsüne gidin.\n` +
        `2. **Ödeme Altyapısı:** Ödemeler Türkiye'nin BDDK lisanslı güvenli ödeme kuruluşu **Shopier** üzerinden 3D Secure kredi/banka kartıyla yapılır.\n` +
        `3. **Anında Aktivasyon:** Ödeme tamamlandığı an paketiniz saniyeler içinde otomatik olarak yükseltilir; ek personel ve sınırsız hizmet limitleri hemen açılır.`,
      quickActions: [
        { id: 'act_billing', label: 'Abonelik & Paketleri Gör', url: '/dashboard/billing' },
      ],
    };
  }

  // 9. QR Kod, Vitrin Afişi & WhatsApp
  if (
    q.includes('qr') ||
    q.includes('afiş') ||
    q.includes('afis') ||
    q.includes('vitrin') ||
    q.includes('yazdır') ||
    q.includes('whatsapp')
  ) {
    return {
      category: 'general',
      title: '📱 QR Kod & Vitrin Afişi Çözümü',
      solution:
        `Dükkanınızın vitrinine veya masalarına koyabileceğiniz baskıya hazır materyaller:\n\n` +
        `1. **Vitrin Afişi:** İşletme Tablonuzun sol menüsündeki veya sayfanızdaki **"QR Kod"** butonuna tıklayın.\n` +
        `2. **Tek Tıkla İndir:** Açılan ekrandan "Afişi İndir / Yazdır" diyerek dükkan logonuz ve karekodunuzun olduğu yüksek kaliteli afişi alıp kuşe kağıda bastırabilirsiniz.\n` +
        `3. **WhatsApp İletişimi:** Randevu alındığında çıkan yeşil "WhatsApp ile Bilgilendir" butonu sayesinde müşteriye randevu detaylarını tek tuşla gönderebilirsiniz.`,
      quickActions: [
        { id: 'act_dashboard', label: 'İşletme Tablosuna Git', url: '/dashboard' },
      ],
    };
  }

  // 10. Uygulama Yükleme (PWA)
  if (
    q.includes('uygulama') ||
    q.includes('yükle') ||
    q.includes('yukle') ||
    q.includes('indir') ||
    q.includes('telefona') ||
    q.includes('pwa') ||
    q.includes('ana ekran')
  ) {
    return {
      category: 'pwa',
      title: '📲 Mobil Uygulamayı Telefona Yükleme Çözümü',
      solution:
        `RANDEVORY uygulamasını telefonunuza uygulama mağazası olmadan 5 saniyede indirebilirsiniz:\n\n` +
        `• **Android (Chrome):** Siteye girdiğinizde altta çıkan "Uygulamayı Yükle" butonuna basın veya sağ üstteki 3 noktaya tıklayıp **"Uygulamayı Yükle / Ana Ekrana Ekle"** deyin.\n` +
        `• **iPhone (Safari):** Safari'de ekranın altındaki **Paylaş (kare içinde yukarı ok)** simgesine dokunun ve aşağı kaydırıp **"Ana Ekrana Ekle"** seçeneğini seçin.\n\n` +
        `Telefonunuzun ana ekranına RANDEVORY ikonu gelir ve tıpkı mağaza uygulaması gibi tam ekran, bildirim destekli ve hızlı çalışır.`,
      quickActions: [
        { id: 'act_home', label: 'Ana Sayfaya Git', url: '/' },
      ],
    };
  }

  // 11. Genel Akıllı Yanıt (NLP Intelligent Fallback)
  return {
    category: 'general',
    title: '🤖 RANDEVORY Akıllı Asistanı Çözüm Rehberi',
    solution:
      `Sorunuzu aldım: "${userText}"\n\n` +
      `Sistemimizde en sık ihtiyaç duyulan çözümler şunlardır:\n\n` +
      `• **Randevu & Takvim:** İşletme Tablonuzdan randevularınızı onaylayabilir, iptal edebilir veya gelmeyenleri "Gelmedi" olarak işaretleyebilirsiniz.\n` +
      `• **Hizmet & Fiyat:** Hizmetler menüsünden süreleri (15, 30, 45, 90 dk vb.) ve fiyatları anında güncelleyebilirsiniz.\n` +
      `• **Masa Düzeni:** Kafe/restoranlar için Masalar & Alanlar menüsünden masa rezervasyonunu açabilirsiniz.\n` +
      `• **Güvenlik & Kara Liste:** Müşteriler sayfasından sahte işlem yapan numaraları tek tıkla engelleyebilirsiniz.\n\n` +
      `Eğer sorununuz devam ediyorsa lütfen aşağıdaki butona tıklayın; kurucu destek ekibimize ileteyim, hemen ilgilenelim!`,
    quickActions: [
      { id: 'connect_human', label: '👨‍💼 Müşteri Temsilcisine Not Bırak' },
      { id: 'restart_options', label: '🔄 Konu Menüsünü Göster' },
    ],
  };
}

export interface SupportAgent {
  id: string;
  name: string;
  title: string;
  gender: 'female' | 'male';
  avatarLetter: string;
  avatarColor: string;
  welcomeGreeting: string;
}

export const SUPPORT_AGENTS: SupportAgent[] = [
  // Çoğunluk Kadın Temsilciler
  {
    id: 'esma',
    name: 'Esma Kaya',
    title: 'Müşteri Temsilcisi',
    gender: 'female',
    avatarLetter: 'E',
    avatarColor: 'from-rose-500 to-pink-600',
    welcomeGreeting:
      'Merhabalar! Ben Esma, Randevory Destek Masasından. Mesajınızı aldım, size yardımcı olmaktan memnuniyet duyarım. Nasıl yardımcı olabilirim?',
  },
  {
    id: 'zeynep',
    name: 'Zeynep Aksoy',
    title: 'Müşteri Destek Uzmanı',
    gender: 'female',
    avatarLetter: 'Z',
    avatarColor: 'from-fuchsia-600 to-pink-600',
    welcomeGreeting:
      'Merhaba! Ben Zeynep, Randevory destek ekibine hoş geldiniz. Sorununuzu hemen birlikte çözelim, size nasıl yardımcı olabilirim?',
  },
  {
    id: 'selin',
    name: 'Selin Yılmaz',
    title: 'Müşteri Temsilcisi',
    gender: 'female',
    avatarLetter: 'S',
    avatarColor: 'from-purple-600 to-indigo-600',
    welcomeGreeting:
      'Merhabalar! Ben Selin. Mesajınızı şimdi okudum, sorununuzu hemen halledelim. Durumu kısaca aktarabilir misiniz?',
  },
  {
    id: 'elif',
    name: 'Elif Öztürk',
    title: 'Müşteri Başarı Temsilcisi',
    gender: 'female',
    avatarLetter: 'E',
    avatarColor: 'from-amber-500 to-rose-500',
    welcomeGreeting:
      'Merhaba! Ben Elif, Randevory canlı destek hattından. Size yardımcı olmak için buradayım, ne konuda destek istersiniz?',
  },
  {
    id: 'buse',
    name: 'Buse Çelik',
    title: 'Kıdemli Destek Uzmanı',
    gender: 'female',
    avatarLetter: 'B',
    avatarColor: 'from-violet-600 to-purple-700',
    welcomeGreeting:
      'Merhabalar! Ben Buse. Randevory destek masasına hoş geldiniz. Konuyla ilgili hemen yardımcı oluyorum.',
  },
  // Erkek Temsilciler
  {
    id: 'burak',
    name: 'Burak Demir',
    title: 'Müşteri Temsilcisi',
    gender: 'male',
    avatarLetter: 'B',
    avatarColor: 'from-blue-600 to-indigo-600',
    welcomeGreeting:
      'Merhaba, ben Burak! Randevory ekibinden. Mesajınızı aldım, sorununuzu hemen birlikte çözelim. Sorununuz nedir acaba?',
  },
  {
    id: 'emre',
    name: 'Emre Can',
    title: 'Müşteri Temsilcisi',
    gender: 'male',
    avatarLetter: 'E',
    avatarColor: 'from-emerald-600 to-teal-700',
    welcomeGreeting:
      'Merhaba! Ben Emre, Randevory destek masasından. Mesajınızı inceliyorum, sorununuzu hemen halledelim.',
  },
  {
    id: 'mert',
    name: 'Mert Kılıç',
    title: 'Destek Uzmanı',
    gender: 'male',
    avatarLetter: 'M',
    avatarColor: 'from-cyan-600 to-blue-700',
    welcomeGreeting:
      'Merhabalar! Ben Mert. Randevory destek ekibine hoş geldiniz. Size nasıl yardımcı olabilirim?',
  },
];

export function getRandomSupportAgent(): SupportAgent {
  return SUPPORT_AGENTS[Math.floor(Math.random() * SUPPORT_AGENTS.length)];
}

export function formatConversationalAgentReply(
  agent: SupportAgent,
  userText: string
): { reply: string; quickActions: Array<{ id: string; label: string; url?: string }> } {
  const resolution = solveSupportQuery(userText);
  const q = userText.toLowerCase();

  // Natural human transitions based on category
  let conversationalIntro = `Merhaba! Ben ${agent.name}. Mesajınızı okudum, hiç merak etmeyin hemen yardımcı olayım.`;
  
  if (resolution.category === 'auth') {
    conversationalIntro = `Merhabalar, ben ${agent.name}. Şifre ve giriş konusundaki sorununuzu şimdi inceledim;`;
  } else if (resolution.category === 'tables') {
    conversationalIntro = `Merhaba! Ben ${agent.name}. Masa ve mekan rezervasyonu düzeniniz hakkında hemen bilgi vereyim;`;
  } else if (resolution.category === 'booking') {
    conversationalIntro = `Merhabalar, ben ${agent.name}. Randevu iptal ve sorgulama işleminiz için yardımcı oluyorum;`;
  } else if (resolution.category === 'calendar') {
    conversationalIntro = `Merhaba! Ben ${agent.name}. Takvimde saatlerin kapalı görünmesi durumunu kontrol ettim;`;
  } else if (resolution.category === 'services') {
    conversationalIntro = `Merhabalar! Ben ${agent.name}. Hizmet süreleri ve fiyat ayarlamaları için hemen adımları aktarayım;`;
  } else if (resolution.category === 'security') {
    conversationalIntro = `Merhaba! Ben ${agent.name}. Gelmeyen müşteriler ve sahte randevu engelleme konusunda sistemimiz hazır;`;
  } else if (resolution.category === 'billing') {
    conversationalIntro = `Merhabalar, ben ${agent.name}. Lisans ve Shopier ödeme süreçlerini hemen açıklayayım;`;
  }

  const naturalReply =
    `${conversationalIntro}\n\n` +
    `${resolution.solution}\n\n` +
    `İşlemi denedikten sonra buradan bana yazarsanız ben de sistemden kontrol edebilirim, başka bir sorunuz olursa da buradayım! 😊`;

  return {
    reply: naturalReply,
    quickActions: resolution.quickActions,
  };
}
