/**
 * RANDEVORY AI Support Brain
 * 7/24 Kesin Çözüm Üreten Doğal Müşteri Temsilcisi Motoru
 */

export interface AiResolution {
  category: 'greeting' | 'help_request' | 'thanks' | 'auth' | 'booking' | 'tables' | 'calendar' | 'services' | 'security' | 'billing' | 'pwa' | 'general';
  title: string;
  solution: string;
  quickActions: Array<{ id: string; label: string; url?: string }>;
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
  // Çoğunluk Kadın Temsilciler (Sadece İsimler)
  {
    id: 'esma',
    name: 'Esma',
    title: 'Müşteri Temsilcisi',
    gender: 'female',
    avatarLetter: 'E',
    avatarColor: 'from-rose-500 to-pink-600',
    welcomeGreeting:
      'Merhabalar! Ben Esma, Randevory Destek Masasından. Mesajınızı aldım, size yardımcı olmaktan memnuniyet duyarım. Nasıl yardımcı olabilirim?',
  },
  {
    id: 'zeynep',
    name: 'Zeynep',
    title: 'Müşteri Temsilcisi',
    gender: 'female',
    avatarLetter: 'Z',
    avatarColor: 'from-fuchsia-600 to-pink-600',
    welcomeGreeting:
      'Merhaba! Ben Zeynep. Randevory destek masasına hoş geldiniz. Sorununuzu hemen birlikte çözelim, size nasıl yardımcı olabilirim?',
  },
  {
    id: 'selin',
    name: 'Selin',
    title: 'Müşteri Temsilcisi',
    gender: 'female',
    avatarLetter: 'S',
    avatarColor: 'from-purple-600 to-indigo-600',
    welcomeGreeting:
      'Merhabalar! Ben Selin. Mesajınızı şimdi okudum, sorununuzu hemen halledelim. Durumu kısaca aktarabilir misiniz?',
  },
  {
    id: 'elif',
    name: 'Elif',
    title: 'Müşteri Temsilcisi',
    gender: 'female',
    avatarLetter: 'E',
    avatarColor: 'from-amber-500 to-rose-500',
    welcomeGreeting:
      'Merhaba! Ben Elif. Size yardımcı olmak için buradayım, ne konuda desteğe ihtiyacınız vardı acaba?',
  },
  {
    id: 'buse',
    name: 'Buse',
    title: 'Müşteri Temsilcisi',
    gender: 'female',
    avatarLetter: 'B',
    avatarColor: 'from-violet-600 to-purple-700',
    welcomeGreeting:
      'Merhabalar! Ben Buse, Randevory ekibinden. Konuyla ilgili hemen yardımcı oluyorum, sorununuz nedir acaba?',
  },
  {
    id: 'merve',
    name: 'Merve',
    title: 'Müşteri Temsilcisi',
    gender: 'female',
    avatarLetter: 'M',
    avatarColor: 'from-pink-500 to-rose-600',
    welcomeGreeting:
      'Merhaba! Ben Merve. Mesajınızı aldım, hemen birlikte ilgilenelim. Hangi konuda yardımcı olabilirim?',
  },
  // Erkek Temsilciler
  {
    id: 'burak',
    name: 'Burak',
    title: 'Müşteri Temsilcisi',
    gender: 'male',
    avatarLetter: 'B',
    avatarColor: 'from-blue-600 to-indigo-600',
    welcomeGreeting:
      'Merhaba, ben Burak! Randevory ekibinden. Mesajınızı aldım, sorununuzu hemen birlikte çözelim. Sorununuz nedir acaba?',
  },
  {
    id: 'emre',
    name: 'Emre',
    title: 'Müşteri Temsilcisi',
    gender: 'male',
    avatarLetter: 'E',
    avatarColor: 'from-cyan-600 to-blue-600',
    welcomeGreeting:
      'Merhabalar! Ben Emre. Canlı destek talebinizi aldım. Size nasıl yardımcı olabilirim?',
  },
  {
    id: 'mert',
    name: 'Mert',
    title: 'Müşteri Temsilcisi',
    gender: 'male',
    avatarLetter: 'M',
    avatarColor: 'from-emerald-600 to-teal-600',
    welcomeGreeting:
      'Merhaba! Ben Mert, Randevory ekibinden. Sorunuzu hemen yanıtlamak için buradayım, durum nedir?',
  },
];

export function getInitialAgentMessage(agent: SupportAgent) {
  return {
    sender: 'admin' as const,
    agent_name: agent.name,
    text:
      agent.welcomeGreeting +
      '\n\nSize hemen yardımcı olabilmem için aşağıdaki konulardan birini seçebilir veya sorununuzu doğrudan aşağıya mesaj olarak yazabilirsiniz:',
    created_at: new Date().toISOString(),
    options: [
      { id: 'menu_app_error', label: '🛠️ Sitede / Uygulamada Hata Alıyorum' },
      { id: 'menu_password', label: '🔑 Şifremi Yenileyemiyorum / Giriş Sorunu' },
      { id: 'menu_link', label: '🔗 İşletme Linkim Bozuk / Açılmıyor' },
      { id: 'menu_booking', label: '📅 Randevu Alma veya İptal Sorunu' },
      { id: 'menu_qr_wp', label: '📱 QR Kod, Afiş veya WhatsApp Sorusu' },
      { id: 'menu_billing', label: '💳 Paketler & Ödeme İşlemleri' },
      { id: 'menu_complaint', label: '🚨 Güvenilir Olmayan İşletme Şikayeti' },
    ],
  };
}

export function solveSupportQuery(userText: string): AiResolution {
  const q = userText.toLowerCase().trim();

  // 1. Selamlaşma & Giriş
  if (
    q === 'merhaba' ||
    q === 'merhabalar' ||
    q === 'selam' ||
    q === 'selamlar' ||
    q === 'iyi günler' ||
    q === 'günaydın' ||
    q === 'iyi akşamlar' ||
    q === 'slm' ||
    q === 'mrb' ||
    q.startsWith('merhaba') ||
    q.startsWith('selam')
  ) {
    return {
      category: 'greeting',
      title: '👋 Canlı Karşılama',
      solution:
        'Merhabalar! Randevory Destek Masasına hoş geldiniz. Size yardımcı olmaktan memnuniyet duyarım. Yaşadığınız durum veya işlem yapmak istediğiniz konu hakkında kısaca bilgi verirseniz hemen birlikte adım adım çözelim.',
      quickActions: [
        { id: 'menu_booking', label: '📅 Randevu İşlemleri' },
        { id: 'menu_password', label: '🔑 Şifre & Giriş' },
        { id: 'menu_tables', label: '🍽️ Masa Rezervasyonu' },
        { id: 'menu_services', label: '✨ Hizmet & Fiyat Düzenleme' },
      ],
    };
  }

  // 2. Doğrudan Yardım İstekleri
  if (
    q === 'yardım' ||
    q === 'yardıma ihtiyacım var' ||
    q === 'yardım edin' ||
    q === 'yardım edebilir misiniz' ||
    q === 'bakar mısınız' ||
    q === 'burada mısınız' ||
    q === 'kimse var mı' ||
    q === 'destek' ||
    q === 'canlı destek' ||
    q.includes('yardım edebilir misiniz') ||
    q.includes('yardıma ihtiyacım') ||
    q.includes('bakar mısınız')
  ) {
    return {
      category: 'help_request',
      title: '🤝 Hazır Destek',
      solution:
        'Tabii ki, hemen buradayım ve size yardımcı olmak için dinliyorum! Randevularınız, masa düzeni, fiyatlandırma, şifre sıfırlama veya panel ayarlarıyla ilgili ne gerekiyorsa hemen çözebiliriz. Yaşadığınız durumu biraz açabilir misiniz?',
      quickActions: [
        { id: 'menu_booking', label: '📅 Randevu Sorunları' },
        { id: 'menu_tables', label: '🍽️ Masa & Salon Düzeni' },
        { id: 'menu_services', label: '✨ Hizmetler & Süreler' },
        { id: 'menu_billing', label: '💳 Paket & Abonelik' },
      ],
    };
  }

  // 3. Teşekkür / Kapanış
  if (
    q === 'teşekkürler' ||
    q === 'teşekkür ederim' ||
    q === 'sağol' ||
    q === 'sağolun' ||
    q === 'eyvallah' ||
    q === 'tamamdır' ||
    q === 'anladım' ||
    q.includes('teşekkür')
  ) {
    return {
      category: 'thanks',
      title: '✨ Teşekkür & Rica',
      solution:
        'Rica ederim, ne demek! İşletmenizin sorunsuz ve verimli çalışması bizim için her şeyden önemli. Başka bir sorunuz veya desteğe ihtiyacınız olursa bana buradan dilediğiniz zaman yazabilirsiniz. İyi çalışmalar ve bol kazançlar dilerim! 😊',
      quickActions: [
        { id: 'act_dashboard', label: 'İşletme Tablosuna Dön', url: '/dashboard' },
      ],
    };
  }

  // 4. Şifre, Giriş ve Hesap Sorunları
  if (
    q.includes('şifre') ||
    q.includes('sifre') ||
    q.includes('parola') ||
    q.includes('giriş yapamıyorum') ||
    q.includes('giris') ||
    q.includes('unuttum') ||
    q.includes('oturum')
  ) {
    return {
      category: 'auth',
      title: '🔑 Şifre Sıfırlama & Giriş Çözümü',
      solution:
        'Giriş ve şifre sorununu hemen 2 adımda çözebilirsiniz:\n\n' +
        '1. **Şifremi Unuttum Ekranı:** Giriş sayfasında (/login) bulunan **"Şifremi Unuttum"** bağlantısına tıklayın ve kayıtlı e-postanızı yazın.\n' +
        '2. **Sıfırlama Bağlantısı:** 1 dakika içinde e-posta kutunuza (Spam/Gereksiz klasörünü de kontrol edin) yeni şifre oluşturma linki gelecektir.\n\n' +
        '💡 *Eğer e-posta gelmiyorsa veya kayıtlı e-postanızı hatırlamıyorsanız, bana e-postanızı yazın; buradan hemen kontrol edeyim.*',
      quickActions: [
        { id: 'act_login', label: 'Giriş Ekranına Git', url: '/login' },
        { id: 'act_forgot', label: 'Şifre Sıfırlama Sayfası', url: '/forgot-password' },
      ],
    };
  }

  // 5. Masa ve Restoran / Kafe Rezervasyonu Sorunları
  if (
    q.includes('masa') ||
    q.includes('restoran') ||
    q.includes('kafe') ||
    q.includes('salon') ||
    q.includes('bölüm') ||
    q.includes('rezervasyon') ||
    q.includes('vip') ||
    q.includes('bahçe')
  ) {
    return {
      category: 'tables',
      title: '🍽️ Masa ve Salon Yönetimi Çözümü',
      solution:
        'Masa yönetimi sistemimiz yalnızca kafe, restoran, oyun salonu veya mekan işletmelerinde aktiftir:\n\n' +
        '1. **Masa Bölümü:** Sol menüdeki **"Masa Yönetimi"** (/dashboard/tables) sekmesine geçin.\n' +
        '2. **Bölüm & Masa Ekleme:** "Bölüm Ekle" (İç Salon, Bahçe, Teras) butonundan mekanınızı bölün, ardından masaların kişi kapasitesini ve adını girin.\n' +
        '3. **Görünürlük:** Berber veya kuaför gibi randevulu hizmet veren işletmelerde masalar gereksiz kalabalık yapmaması için gizlenmiştir. İstediğiniz zaman İşletme Ayarları > Özellikler kısmından masa modunu açıp kapatabilirsiniz.',
      quickActions: [
        { id: 'act_tables', label: 'Masa Yönetimine Git', url: '/dashboard/tables' },
        { id: 'act_settings', label: 'İşletme Ayarlarına Git', url: '/dashboard/settings' },
      ],
    };
  }

  // 6. Randevu Alma, İptal ve Saat Sorunları
  if (
    q.includes('randevu') ||
    q.includes('iptal') ||
    q.includes('sorgula') ||
    q.includes('saat') ||
    q.includes('dolu') ||
    q.includes('boş') ||
    q.includes('slot')
  ) {
    return {
      category: 'booking',
      title: '📅 Randevu İşlemleri & Takvim Çözümü',
      solution:
        'Randevu oluşturma ve yönetimiyle ilgili pratik çözümler:\n\n' +
        '• **Randevu İptali (Müşteri için):** İşletmenin randevu linkine girip sağ üstteki **"Randevu Sorgula / İptal"** sekmesinden telefon numarasıyla anında iptal edilebilir.\n' +
        '• **Randevu İptali (İşletme için):** Yönetim Panelinizdeki **"Randevular"** sekmesinden ilgili randevunun yanındaki üç noktadan "İptal Et" seçeneğini seçebilirsiniz.\n' +
        '• **Saat Çakışması Önleme:** Aynı personele aynı saatte 2 randevu verilemez; sistem dolu saatleri otomatik olarak listeden kaldırır.',
      quickActions: [
        { id: 'act_apts', label: 'Randevular Listesine Git', url: '/dashboard/appointments' },
        { id: 'act_calendar', label: 'Takvime Git', url: '/dashboard/calendar' },
      ],
    };
  }

  // 7. Takvimde Saatlerin Kapalı / Görünmeme Sorunu
  if (
    q.includes('saatler kapalı') ||
    q.includes('saat görünmüyor') ||
    q.includes('müsait saat yok') ||
    q.includes('randevu alınamıyor') ||
    q.includes('takvim boş')
  ) {
    return {
      category: 'calendar',
      title: '⏰ Takvimde Saat Görünmeme Çözümü',
      solution:
        'Müşterileriniz randevu alırken saatlerin kapalı görünmesinin 3 temel sebebi vardır:\n\n' +
        '1. **Çalışma Saatleri:** **İşletme Ayarları > Çalışma Saatleri** sayfasında o günün "Açık" olduğundan emin olun (örneğin Pazartesi 09:00 - 19:00).\n' +
        '2. **Personel Eşleşmesi:** En az bir personelinizin hizmetlerle eşleştirilmiş olması ve çalışma saatlerinin tanımlı olması gerekir.\n' +
        '3. **İleri Tarih Limiti:** Müşterilerin en fazla kaç gün sonrasına randevu alabileceği kısıtlanmış olabilir.',
      quickActions: [
        { id: 'act_settings_hours', label: 'Çalışma Saatlerini Ayarla', url: '/dashboard/settings' },
        { id: 'act_staff', label: 'Personel Listesine Git', url: '/dashboard/staff' },
      ],
    };
  }

  // 8. Hizmetler, Fiyatlar ve Süreler
  if (
    q.includes('hizmet') ||
    q.includes('fiyat') ||
    q.includes('ücret') ||
    q.includes('süre') ||
    q.includes('dakika') ||
    q.includes('kategori')
  ) {
    return {
      category: 'services',
      title: '✨ Hizmet & Fiyat Yönetimi Çözümü',
      solution:
        'Hizmetlerinizi ve fiyatlarınızı güncellemek için:\n\n' +
        '1. Sol menüden **"Hizmetler"** (/dashboard/services) sekmesine girin.\n' +
        '2. "Yeni Hizmet Ekle" butonuyla hizmet adı, süresi (örneğin 30 dk) ve fiyatını belirleyin.\n' +
        '3. Süreler çok önemlidir; randevu takvimi seçilen hizmetin dakikasına göre sonraki randevuyu otomatik öteler ve çakışmayı engeller.',
      quickActions: [
        { id: 'act_services', label: 'Hizmetler Sayfasına Git', url: '/dashboard/services' },
      ],
    };
  }

  // 9. Sahte Randevu, Gelmeyen Müşteriler (No-Show) ve Güvenlik
  if (
    q.includes('gelmeyen') ||
    q.includes('no-show') ||
    q.includes('sahte') ||
    q.includes('troll') ||
    q.includes('kara liste') ||
    q.includes('engelle') ||
    q.includes('önlem') ||
    q.includes('spam')
  ) {
    return {
      category: 'security',
      title: '🛡️ Sahte Randevu & No-Show Engelleme Çözümü',
      solution:
        'RANDEVORY işletmenizi sahte ve ciddiyetsiz randevulardan korumak için 3 katmanlı güvenlik sunar:\n\n' +
        '1. **Telefon SMS / OTP Doğrulama:** Randevu oluşturan müşterilere 4 haneli güvenlik onay kodu gider, sahte numarayla işlem yapılamaz.\n' +
        '2. **Kara Liste (1 Tıkla Engelleme):** Randevusuna mazeretsiz gelmeyen müşteriyi **Müşteriler** (/dashboard/customers) sayfasından tek tuşla kara listeye alabilirsiniz. Kara listedeki numara bir daha dükkanınızdan randevu alamaz.\n' +
        '3. **Günlük Randevu Limiti:** Aynı telefon numarasından günde en fazla 2 aktif randevu alınabilir, art arda slot işgali engellenir.',
      quickActions: [
        { id: 'act_customers', label: 'Müşteri & Kara Liste Ekranı', url: '/dashboard/customers' },
      ],
    };
  }

  // 10. Paketler, Abonelik ve Ödeme
  if (
    q.includes('paket') ||
    q.includes('abonelik') ||
    q.includes('lisans') ||
    q.includes('ödeme') ||
    q.includes('shopier') ||
    q.includes('satın al') ||
    q.includes('pro') ||
    q.includes('standart')
  ) {
    return {
      category: 'billing',
      title: '💳 Abonelik, Paketler & Lisans Çözümü',
      solution:
        'RANDEVORY paketleri işletmenizin büyüklüğüne göre ölçeklenir:\n\n' +
        '• **Ücretsiz Paket:** 1 personel ve temel randevu takvimiyle dükkanınızı hemen açıp test edebilirsiniz.\n' +
        '• **Standart & Pro Paketler:** Sınırsız personel, WhatsApp bildirim entegrasyonu, QR kodlu vitrin afişi ve detaylı ciro raporlaması içerir.\n' +
        '• **Shopier Güvenli Ödeme:** Yönetim Panelinizdeki **"Abonelik & Lisans"** (/dashboard/billing) menüsünden kredi kartıyla 3D Secure güvencesiyle anında yükseltebilirsiniz.',
      quickActions: [
        { id: 'act_billing', label: 'Abonelik & Paketler Sayfası', url: '/dashboard/billing' },
      ],
    };
  }

  // 11. İşletme Linki & Web Sayfası
  if (
    q.includes('link') ||
    q.includes('bağlantı') ||
    q.includes('sayfam') ||
    q.includes('web sitesi') ||
    q.includes('açılmıyor') ||
    q.includes('bulunamadı')
  ) {
    return {
      category: 'general',
      title: '🔗 İşletme Randevu Linki Çözümü',
      solution:
        'İşletmenizin müşterilere göndereceğiniz randevu linki: **randevory.com/isletme-adiniz** şeklindedir.\n\n' +
        '• Linkinizi sol üstteki **"Sayfamı Gör"** veya **İşletme Ayarları** sayfasından kopyalayabilirsiniz.\n' +
        '• Instagram biyografinize veya WhatsApp İşletme profilinize bu linki ekleyerek müşterilerinizin 7/24 kendiliğinden randevu oluşturmasını sağlayabilirsiniz.\n' +
        '• Türkçe karakterli linklerdeki uyumsuzluklar sistemimiz tarafından otomatik düzeltilir.',
      quickActions: [
        { id: 'act_settings_slug', label: 'İşletme Ayarlarını Aç', url: '/dashboard/settings' },
      ],
    };
  }

  // 12. QR Kod, Vitrin Afişi & WhatsApp
  if (
    q.includes('qr') ||
    q.includes('karekod') ||
    q.includes('afiş') ||
    q.includes('vitrin') ||
    q.includes('baskı') ||
    q.includes('whatsapp')
  ) {
    return {
      category: 'general',
      title: '📱 QR Kod & Vitrin Afişi Çözümü',
      solution:
        'Dükkanınızın vitrinine veya masalarına koyabileceğiniz baskıya hazır materyaller:\n\n' +
        '1. **Vitrin Afişi:** İşletme Tablonuzun sol menüsündeki veya sayfanızdaki **"QR Kod"** butonuna tıklayın.\n' +
        '2. **Tek Tıkla İndir:** Açılan ekrandan "Afişi İndir / Yazdır" diyerek dükkan logonuz ve karekodunuzun olduğu yüksek kaliteli afişi alıp kuşe kağıda bastırabilirsiniz.\n' +
        '3. **WhatsApp İletişimi:** Randevu alındığında çıkan yeşil "WhatsApp ile Bilgilendir" butonu sayesinde müşteriye randevu detaylarını tek tuşla gönderebilirsiniz.',
      quickActions: [
        { id: 'act_dashboard', label: 'İşletme Tablosuna Git', url: '/dashboard' },
      ],
    };
  }

  // 13. Uygulama Yükleme (PWA)
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
        'RANDEVORY uygulamasını telefonunuza uygulama mağazası olmadan 5 saniyede indirebilirsiniz:\n\n' +
        '• **Android (Chrome):** Siteye girdiğinizde altta çıkan "Uygulamayı Yükle" butonuna basın veya sağ üstteki 3 noktaya tıklayıp **"Uygulamayı Yükle / Ana Ekrana Ekle"** deyin.\n' +
        '• **iPhone (Safari):** Safari\'de ekranın altındaki **Paylaş (kare içinde yukarı ok)** simgesine dokunun ve aşağı kaydırıp **"Ana Ekrana Ekle"** seçeneğini seçin.\n\n' +
        'Telefonunuzun ana ekranına RANDEVORY ikonu gelir ve tıpkı mağaza uygulaması gibi tam ekran, bildirim destekli ve hızlı çalışır.',
      quickActions: [
        { id: 'act_home', label: 'Ana Sayfaya Git', url: '/' },
      ],
    };
  }

  // 14. Genel Her Konuya Cevap Veren Doğal Temsilci Yanıtı
  return {
    category: 'general',
    title: '💬 Destek Yanıtı',
    solution:
      `Mesajınızı aldım ve okudum ("${userText}").\n\n` +
      `Konuyla ilgili size hemen en doğru çözümü sunabilmem için durumunuzu biraz daha detaylandırabilir misiniz? Ya da randevu, şifre, masa düzeni, fiyatlar veya işletme ayarları gibi bir konuda mı işlem yapmak istiyordunuz?\n\n` +
      `Siz mesajınızı yazın, ben hemen buradan adım adım yardımcı olacağım.`,
    quickActions: [
      { id: 'menu_booking', label: '📅 Randevu İşlemleri' },
      { id: 'menu_password', label: '🔑 Şifre & Giriş' },
      { id: 'menu_tables', label: '🍽️ Masa Rezervasyonu' },
      { id: 'menu_services', label: '✨ Hizmetler & Fiyat' },
    ],
  };
}

export function formatConversationalAgentReply(
  agent: SupportAgent,
  userText: string
): { reply: string; quickActions: Array<{ id: string; label: string; url?: string }> } {
  const resolution = solveSupportQuery(userText);

  // If greeting, thanks, or help request, return direct natural reply without robotic headers
  if (resolution.category === 'greeting' || resolution.category === 'thanks' || resolution.category === 'help_request') {
    return {
      reply: resolution.solution,
      quickActions: resolution.quickActions,
    };
  }

  let conversationalIntro = `Merhabalar! Ben ${agent.name}. Mesajınızı okudum, hemen yardımcı olayım;`;

  if (resolution.category === 'auth') {
    conversationalIntro = `Merhabalar, ben ${agent.name}. Şifre ve giriş konusundaki sorununuzu inceledim;`;
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
