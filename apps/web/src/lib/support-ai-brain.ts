/**
 * RANDEVORY AI Support Brain
 * Profesyonel, Doğal ve Canlı Müşteri Temsilcisi Motoru
 */

export interface AiResolution {
  category:
    | 'wellbeing'
    | 'privacy'
    | 'identity'
    | 'greeting'
    | 'help_request'
    | 'thanks'
    | 'slang'
    | 'complaint_dissatisfaction'
    | 'auth'
    | 'booking'
    | 'tables'
    | 'calendar'
    | 'services'
    | 'security'
    | 'billing'
    | 'pwa'
    | 'general';
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
  // Kadın Temsilciler (Ağırlıklı)
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

export function getRandomSupportAgent(): SupportAgent {
  return SUPPORT_AGENTS[Math.floor(Math.random() * SUPPORT_AGENTS.length)];
}

export function getInitialBotMessage(): {
  sender: 'admin';
  text: string;
  created_at: string;
  options: Array<{ id: string; label: string }>;
} {
  return {
    sender: 'admin',
    text:
      'Merhabalar! RANDEVORY Destek Masasına hoş geldiniz.\n\n' +
      'Size hemen yardımcı olabilmemiz için aşağıdaki hızlı başlıklardan birini seçebilir veya sorununuzu doğrudan aşağıya mesaj olarak yazabilirsiniz.',
    created_at: new Date().toISOString(),
    options: [
      { id: 'menu_app_error', label: '🛠️ Sitede / Uygulamada Hata Alıyorum' },
      { id: 'menu_password', label: '🔑 Şifremi Yenileyemiyorum / Giriş Sorunu' },
      { id: 'menu_link', label: '🔗 İşletme Linkim Bozuk / Açılmıyor' },
      { id: 'menu_booking', label: '📅 Randevu Alma veya İptal Sorunu' },
      { id: 'menu_qr_wp', label: '📱 QR Kod, Afiş veya WhatsApp Sorusu' },
      { id: 'menu_billing', label: '💳 Paketler & Ödeme İşlemleri' },
      { id: 'connect_human', label: '👩‍💼 Canlı Müşteri Temsilcisine Bağlan' },
    ],
  };
}

export function solveSupportQuery(userText: string): AiResolution {
  const raw = userText.toLowerCase().trim();
  // Normalize Turkish characters for robust matching
  const q = raw
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');

  // 1. Hal / Hatır / Nasılsınız / Ne Haber
  if (
    q.includes('nasilsin') ||
    q.includes('naber') ||
    q.includes('ne haber') ||
    q.includes('nasil gidiyor') ||
    q.includes('keyifler nasil') ||
    q.includes('iyi misin') ||
    q.includes('ne var ne yok')
  ) {
    return {
      category: 'wellbeing',
      title: '😊 Hal & Hatır',
      solution:
        'Çok teşekkür ederim, çok iyiyim! Siz nasılsınız, umarım gününüz güzel ve işleriniz bereketli geçiyordur? 😊\n\n' +
        'Size ve işletmenize bugün nasıl yardımcı olabilirim?',
      quickActions: [
        { id: 'menu_booking', label: '📅 Randevu İşlemleri' },
        { id: 'menu_password', label: '🔑 Şifre & Giriş' },
        { id: 'menu_tables', label: '🍽️ Masa Rezervasyonu' },
        { id: 'menu_services', label: '✨ Hizmet & Fiyat Düzenleme' },
      ],
    };
  }

  // 2. Kullanıcının İyiyim / Süperim Yanıtı
  if (
    q === 'iyiyim' ||
    q === 'bende iyiyim' ||
    q === 'ben de iyiyim' ||
    q === 'cok sukur' ||
    q === 'sukursun' ||
    q.startsWith('iyiyim') ||
    q.includes('iyiyim tesekkur')
  ) {
    return {
      category: 'wellbeing',
      title: '✨ Memnuniyet',
      solution:
        'Harika, iyi olmanıza çok sevindim! Randevory ile ilgili sormak istediğiniz veya işletmenizde birlikte halledebileceğimiz bir durum var mıydı?',
      quickActions: [
        { id: 'menu_booking', label: '📅 Randevularım' },
        { id: 'menu_tables', label: '🍽️ Masa Yönetimi' },
        { id: 'act_dashboard', label: 'İşletme Paneli', url: '/dashboard' },
      ],
    };
  }

  // 3. Kişisel Bilgi / Güvenlik & Gizlilik Sınırı (Numara, Yaş, Evlilik, Sosyal Medya)
  if (
    q.includes('nerelisin') ||
    q.includes('yasin kac') ||
    q.includes('yas kac') ||
    q.includes('evli misin') ||
    q.includes('sevgilin') ||
    q.includes('numarani ver') ||
    q.includes('telefon numaran') ||
    q.includes('numaran ne') ||
    q.includes('instagram') ||
    q.includes('nerede oturuyorsun') ||
    q.includes('neredesin') ||
    q.includes('sehir neresi')
  ) {
    return {
      category: 'privacy',
      title: '🔒 Güvenlik & Gizlilik',
      solution:
        'Şirketimizin güvenlik ve kişisel veri gizliliği kuralları gereği temsilcilerimizin şahsi iletişim ve özel bilgilerini paylaşamıyoruz efendim.\n\n' +
        'Ancak Randevory platformu, randevu sisteminiz, çalışma saatleriniz ve işletme ayarlarınızla ilgili her türlü konuda memnuniyetle yardımcı olmaya hazırım! Size ne konuda destek sağlayabilirim? 😊',
      quickActions: [
        { id: 'menu_booking', label: '📅 Randevu Konuları' },
        { id: 'menu_password', label: '🔑 Şifre & Giriş' },
        { id: 'menu_billing', label: '💳 Paketler & Abonelik' },
      ],
    };
  }

  // 4. Robot / Bot / Yapay Zeka / Sen Kimsin Sorguları
  if (
    q.includes('robot musun') ||
    q.includes('bot musun') ||
    q.includes('yapay zeka') ||
    q.includes('gercek misin') ||
    q.includes('canli misin') ||
    q.includes('insan misin') ||
    q.includes('sen kimsin') ||
    q === 'kimsin' ||
    q === 'sen kimsin'
  ) {
    return {
      category: 'identity',
      title: '👩‍💼 Temsilci Tanıtımı',
      solution:
        'Randevory Destek Masası müşteri temsilcisiyim efendim. İşletmenizin randevuları, çalışma saatleri, masa düzeni veya yönetim paneliyle ilgili ihtiyaç duyduğunuz tüm konularda canlı destek vermek için buradayım.\n\n' +
        'Size bugün nasıl yardımcı olabilirim?',
      quickActions: [
        { id: 'menu_booking', label: '📅 Randevu İşlemleri' },
        { id: 'menu_services', label: '✨ Hizmet & Fiyatlar' },
        { id: 'menu_password', label: '🔑 Şifre & Güvenlik' },
      ],
    };
  }

  // 5. Samimi / Argo / Hitaplar (Kanka, Kral, Abi, Reis, Hocam)
  if (
    q === 'kanka' ||
    q.startsWith('kanka ') ||
    q === 'kral' ||
    q.startsWith('kral ') ||
    q === 'reis' ||
    q.startsWith('reis ') ||
    q === 'abi' ||
    q.startsWith('abi ') ||
    q === 'hocam' ||
    q.startsWith('hocam ') ||
    q === 'usta'
  ) {
    return {
      category: 'slang',
      title: '🤝 Samimi Karşılama',
      solution:
        'Merhabalar! Size ve işletmenize yardımcı olmak için buradayım. Paneliniz veya randevularınızla ilgili yaşanan durum nedir, hemen birlikte bakalım.',
      quickActions: [
        { id: 'menu_booking', label: '📅 Randevu Sorunu' },
        { id: 'menu_tables', label: '🍽️ Masa Düzeni' },
        { id: 'menu_billing', label: '💳 Paket Bilgisi' },
      ],
    };
  }

  // 6. Şikayet / Öfke / Çalışmıyor / Hata / İsyankarlık
  if (
    q.includes('calismiyor') ||
    q.includes('bozuk') ||
    q.includes('rezalet') ||
    q.includes('berbat') ||
    q.includes('sinir oldum') ||
    q.includes('sikayet') ||
    q.includes('dolandirici') ||
    q.includes('yardim etmiyorsun') ||
    q.includes('sacma')
  ) {
    return {
      category: 'complaint_dissatisfaction',
      title: '⚠️ Çözüm Odaklı Destek',
      solution:
        'Yaşadığınız aksaklık ve olumsuzluk için gerçekten çok üzgünüm efendim, sizi çok iyi anlıyorum. Durumu hemen ele alıp çözelim.\n\n' +
        'Karşılaştığınız sorunu veya aldığınız hatayı kısaca yazabilir misiniz? Hemen müdahale edip düzeltelim.',
      quickActions: [
        { id: 'menu_app_error', label: '🛠️ Hata Detayı Seç' },
        { id: 'menu_link', label: '🔗 Link Kontrolü' },
      ],
    };
  }

  // 7. Selamlaşma & Giriş
  if (
    q === 'merhaba' ||
    q === 'merhabalar' ||
    q === 'selam' ||
    q === 'selamlar' ||
    q === 'iyi gunler' ||
    q === 'gunaydin' ||
    q === 'iyi aksamlar' ||
    q === 'slm' ||
    q === 'mrb' ||
    q.startsWith('merhaba') ||
    q.startsWith('selam') ||
    q.includes('kolay gelsin') ||
    q.includes('iyi calismalar') ||
    q.includes('hayirli isler')
  ) {
    return {
      category: 'greeting',
      title: '👋 Canlı Karşılama',
      solution:
        'Merhabalar! Randevory Destek Masasına hoş geldiniz, size de iyi çalışmalar dilerim. Yaşadığınız durum veya işlem yapmak istediğiniz konu hakkında bilgi verirseniz hemen yardımcı olayım.',
      quickActions: [
        { id: 'menu_booking', label: '📅 Randevu İşlemleri' },
        { id: 'menu_password', label: '🔑 Şifre & Giriş' },
        { id: 'menu_tables', label: '🍽️ Masa Rezervasyonu' },
        { id: 'menu_services', label: '✨ Hizmet & Fiyat Düzenleme' },
      ],
    };
  }

  // 8. Doğrudan Yardım İstekleri
  if (
    q === 'yardim' ||
    q === 'yardima ihtiyacim var' ||
    q === 'yardim edin' ||
    q === 'yardim edebilir misiniz' ||
    q === 'bakar misiniz' ||
    q === 'burada misiniz' ||
    q === 'kimse var mi' ||
    q === 'destek' ||
    q === 'canli destek' ||
    q.includes('yardim edebilir misiniz') ||
    q.includes('yardima ihtiyacim') ||
    q.includes('bakar misiniz')
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

  // 9. Teşekkür / Kapanış / Memnuniyet
  if (
    q === 'tesekkurler' ||
    q === 'tesekkur ederim' ||
    q === 'sagol' ||
    q === 'sagolun' ||
    q === 'eyvallah' ||
    q === 'tamamdir' ||
    q === 'anladim' ||
    q.includes('tesekkur') ||
    q.includes('harikasin') ||
    q.includes('adamsin') ||
    q.includes('cok iyisiniz')
  ) {
    return {
      category: 'thanks',
      title: '✨ Teşekkür & Rica',
      solution:
        'Rica ederim, ne demek! Memnuniyetiniz ve işletmenizin verimli çalışması bizim için her şeyden önemli. Başka bir sorunuz veya desteğe ihtiyacınız olursa bana buradan dilediğiniz zaman yazabilirsiniz. İyi çalışmalar ve bol kazançlar dilerim! 😊',
      quickActions: [
        { id: 'act_dashboard', label: 'İşletme Tablosuna Dön', url: '/dashboard' },
      ],
    };
  }

  // 10. Şifre, Giriş ve Hesap Sorunları
  if (
    q.includes('sifre') ||
    q.includes('parola') ||
    q.includes('giris yapamiyorum') ||
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

  // 11. Masa ve Restoran / Kafe Rezervasyonu Sorunları
  if (
    q.includes('masa') ||
    q.includes('restoran') ||
    q.includes('kafe') ||
    q.includes('salon') ||
    q.includes('bolum') ||
    q.includes('rezervasyon') ||
    q.includes('vip') ||
    q.includes('bahce')
  ) {
    return {
      category: 'tables',
      title: '🍽️ Masa ve Salon Yönetimi Çözümü',
      solution:
        'Masa yönetimi sistemimiz kafe, restoran veya mekan işletmeleri için özel olarak tasarlanmıştır:\n\n' +
        '1. **Masa Bölümü:** Sol menüdeki **"Masa Yönetimi"** (/dashboard/tables) sekmesine geçin.\n' +
        '2. **Bölüm & Masa Ekleme:** "Bölüm Ekle" (İç Salon, Bahçe, Teras) butonundan mekanınızı bölün, ardından masaların kişi kapasitesini ve adını girin.\n' +
        '3. **Görünürlük:** Berber veya kuaför gibi randevulu hizmet veren işletmelerde masalar gereksiz kalabalık yapmaması için gizlenmiştir. İstediğiniz zaman İşletme Ayarları > Özellikler kısmından masa modunu açıp kapatabilirsiniz.',
      quickActions: [
        { id: 'act_tables', label: 'Masa Yönetimine Git', url: '/dashboard/tables' },
        { id: 'act_settings', label: 'İşletme Ayarlarına Git', url: '/dashboard/settings' },
      ],
    };
  }

  // 12. Randevu Alma, İptal ve Saat Sorunları
  if (
    q.includes('randevu') ||
    q.includes('iptal') ||
    q.includes('sorgula') ||
    q.includes('saat') ||
    q.includes('dolu') ||
    q.includes('bos') ||
    q.includes('slot')
  ) {
    return {
      category: 'booking',
      title: '📅 Randevu İşlemleri & Takvim Çözümü',
      solution:
        'Randevu oluşturma ve yönetimiyle ilgili adımlar:\n\n' +
        '• **Randevu İptali (Müşteri için):** İşletmenin randevu linkine girip sağ üstteki **"Randevu Sorgula / İptal"** sekmesinden telefon numarasıyla anında iptal edilebilir.\n' +
        '• **Randevu İptali (İşletme için):** Yönetim Panelinizdeki **"Randevular"** sekmesinden ilgili randevunun yanındaki üç noktadan "İptal Et" seçeneğini seçebilirsiniz.\n' +
        '• **Saat Çakışması Önleme:** Aynı personele aynı saatte 2 randevu verilemez; sistem dolu saatleri otomatik olarak listeden kaldırır.',
      quickActions: [
        { id: 'act_apts', label: 'Randevular Listesine Git', url: '/dashboard/appointments' },
        { id: 'act_calendar', label: 'Takvime Git', url: '/dashboard/calendar' },
      ],
    };
  }

  // 13. Takvimde Saatlerin Kapalı / Görünmeme Sorunu
  if (
    q.includes('saatler kapali') ||
    q.includes('saat gorunmuyor') ||
    q.includes('musait saat yok') ||
    q.includes('randevu alinamiyor') ||
    q.includes('takvim bos')
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

  // 14. Hizmetler, Fiyatlar ve Süreler
  if (
    q.includes('hizmet') ||
    q.includes('fiyat') ||
    q.includes('ucret') ||
    q.includes('sure') ||
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

  // 15. Sahte Randevu, Gelmeyen Müşteriler (No-Show) ve Güvenlik
  if (
    q.includes('gelmeyen') ||
    q.includes('no-show') ||
    q.includes('sahte') ||
    q.includes('troll') ||
    q.includes('kara liste') ||
    q.includes('engelle') ||
    q.includes('onlem') ||
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

  // 16. Paketler, Abonelik ve Ödeme
  if (
    q.includes('paket') ||
    q.includes('abonelik') ||
    q.includes('lisans') ||
    q.includes('odeme') ||
    q.includes('shopier') ||
    q.includes('satin al') ||
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

  // 17. İşletme Linki & Web Sayfası
  if (
    q.includes('link') ||
    q.includes('baglanti') ||
    q.includes('sayfam') ||
    q.includes('web sitesi') ||
    q.includes('acilmiyor') ||
    q.includes('bulunamadi')
  ) {
    return {
      category: 'general',
      title: '🔗 İşletme Randevu Linki Çözümü',
      solution:
        'İşletmenizin müşterilere göndereceğiniz randevu linki: **randevory.com/isletme-adiniz** şeklindedir.\n\n' +
        '• Linkinizi sol üstteki **"Sayfamı Gör"** veya **İşletme Ayarları** sayfasından kopyalayabilirsiniz.\n' +
        '• Instagram biyografinize veya WhatsApp İşletme profilinize bu linki ekleyerek müşterilerinizin 7/24 kendiliğinden randevu oluşturmasını sağlayabilirsiniz.',
      quickActions: [
        { id: 'act_settings_slug', label: 'İşletme Ayarlarını Aç', url: '/dashboard/settings' },
      ],
    };
  }

  // 18. QR Kod, Vitrin Afişi & WhatsApp
  if (
    q.includes('qr') ||
    q.includes('karekod') ||
    q.includes('afis') ||
    q.includes('vitrin') ||
    q.includes('baski') ||
    q.includes('whatsapp')
  ) {
    return {
      category: 'general',
      title: '📱 QR Kod & Vitrin Afişi Çözümü',
      solution:
        'Dükkanınızın vitrinine veya masalarına koyabileceğiniz baskıya hazır materyaller:\n\n' +
        '1. **Vitrin Afişi:** İşletme Tablonuzun sol menüsündeki veya sayfanızdaki **"QR Kod"** butonuna tıklayın.\n' +
        '2. **Tek Tıkla İndir:** Açılan ekrandan "Afişi İndir / Yazdır" diyerek dükkan logonuz ve karekodunuzun olduğu yüksek kaliteli afişi alıp bastırabilirsiniz.\n' +
        '3. **WhatsApp İletişimi:** Randevu alındığında çıkan yeşil "WhatsApp ile Bilgilendir" butonu sayesinde müşteriye randevu detaylarını tek tuşla gönderebilirsiniz.',
      quickActions: [
        { id: 'act_dashboard', label: 'İşletme Tablosuna Git', url: '/dashboard' },
      ],
    };
  }

  // 19. Uygulama Yükleme (PWA)
  if (
    q.includes('uygulama') ||
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
        '• **iPhone (Safari):** Safari\'de ekranın altındaki **Paylaş (kare içinde yukarı ok)** simgesine dokunun ve aşağı kaydırıp **"Ana Ekrana Ekle"** seçeneğini seçin.',
      quickActions: [
        { id: 'act_home', label: 'Ana Sayfaya Git', url: '/' },
      ],
    };
  }

  // 20. Genel Doğal Temsilci Yanıtı (ASLA echo yok!)
  return {
    category: 'general',
    title: '💬 Destek Yanıtı',
    solution:
      'Mesajınızı okudum. Bu konuda size en doğru ve hızlı şekilde yardımcı olabilmem için durumu biraz daha açabilir misiniz?\n\n' +
      'Örneğin randevu alma veya iptali, şifre sıfırlama, masa düzeni, fiyatlar veya işletme ayarlarınız gibi hangi işlemde destek istersiniz?',
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

  // Doğal konuşma kategorilerinde doğrudan samimi ve net yanıt dön (hiçbir kalıp şablon olmadan)
  if (
    resolution.category === 'wellbeing' ||
    resolution.category === 'privacy' ||
    resolution.category === 'identity' ||
    resolution.category === 'greeting' ||
    resolution.category === 'thanks' ||
    resolution.category === 'help_request' ||
    resolution.category === 'slang' ||
    resolution.category === 'complaint_dissatisfaction'
  ) {
    return {
      reply: resolution.solution,
      quickActions: resolution.quickActions,
    };
  }

  // Teknik konularda ise temsilcinin adı ve pratik adımlarla yanıt ver
  let conversationalIntro = `Merhabalar, ben ${agent.name}. Konuyla ilgili hemen yardımcı olayım;`;

  if (resolution.category === 'auth') {
    conversationalIntro = `Merhabalar, ben ${agent.name}. Şifre ve giriş konusunu hemen halledelim;`;
  } else if (resolution.category === 'tables') {
    conversationalIntro = `Merhaba! Ben ${agent.name}. Masa ve salon düzeninizi hemen açıklayayım;`;
  } else if (resolution.category === 'booking') {
    conversationalIntro = `Merhabalar, ben ${agent.name}. Randevu işlemleriniz için adımlar şöyle;`;
  } else if (resolution.category === 'calendar') {
    conversationalIntro = `Merhaba! Ben ${agent.name}. Takvimde saatlerin kapalı görünme durumunu kontrol ettim;`;
  } else if (resolution.category === 'services') {
    conversationalIntro = `Merhabalar! Ben ${agent.name}. Hizmetler ve fiyat ayarlamaları için adımları aktarayım;`;
  } else if (resolution.category === 'security') {
    conversationalIntro = `Merhaba! Ben ${agent.name}. Gelmeyen müşteriler ve sahte randevulara karşı sistemimiz hazır;`;
  } else if (resolution.category === 'billing') {
    conversationalIntro = `Merhabalar, ben ${agent.name}. Lisans ve paket detaylarını hemen aktarıyorum;`;
  }

  const naturalReply =
    `${conversationalIntro}\n\n` +
    `${resolution.solution}\n\n` +
    `İşlemi denedikten sonra bana buradan yazarsanız ben de sistemden kontrol edebilirim, başka bir sorunuz olursa da buradayım! 😊`;

  return {
    reply: naturalReply,
    quickActions: resolution.quickActions,
  };
}
