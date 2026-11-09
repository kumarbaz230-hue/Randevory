import React from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';
import {
  ShieldCheck,
  FileText,
  RefreshCcw,
  Lock,
  ArrowLeft,
  Mail,
  Globe,
  Scale,
  AlertTriangle,
  Building,
  Clock,
  Server,
  ShieldAlert,
  Smartphone,
  Cpu,
  Cookie,
  Users,
  CheckCircle2,
} from 'lucide-react';

export default function LegalTermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/95 border-b border-slate-200 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <BrandLogo size="sm" showBadge={true} showSlogan={false} />
          <Link
            href="/"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Ana Sayfaya Dön
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 flex-1">
        {/* Başlık ve Hızlı Gezinme */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 font-bold text-[11px] mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
            Resmi Hukuki Çerçeve, KVKK & Mesafeli Sözleşmeler
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Kullanıcı Sözleşmesi, KVKK Aydınlatma Metni ve Yasal Şartlar
          </h1>
          <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
            Son Güncelleme: {new Date().toLocaleDateString('tr-TR')} • 6698 Sayılı KVKK, 6563 Sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun, 6502 Sayılı Tüketicinin Korunması Hakkında Kanun ve 5651 Sayılı İnternet Ortamında Yapılan Yayınların Düzenlenmesi Kanunu uyarınca hazırlanmış resmi yasal bağlayıcı metindir.
          </p>

          <div className="mt-5 flex flex-wrap gap-2 text-xs">
            <a href="#kapsam" className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors">
              1. Bu Metin Kimleri Kapsar?
            </a>
            <a href="#sorumluluk" className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors">
              2. Platform Sorumluluk Sınırları
            </a>
            <a href="#personel-guvenlik" className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold transition-colors">
              3. Personel & Numara Gizliliği (TCK 135)
            </a>
            <a href="#sms-etk" className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold transition-colors">
              4. SMS & Ticari İleti Şartları
            </a>
            <a href="#kvkk" className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold transition-colors">
              5. KVKK Aydınlatma & Yurtdışı Aktarım
            </a>
            <a href="#cerez" className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors">
              6. Çerez Politikası
            </a>
            <a href="#hizmet-sozlesmesi" className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors">
              7. Güncel Lisans Paketleri & Sözleşme
            </a>
            <a href="#iptal-iade" className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors">
              8. İptal ve İade Şartları
            </a>
          </div>
        </div>

        {/* 1. Bu Metin Kimleri Kapsar? */}
        <section id="kapsam" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-600 shrink-0" />
            1. Bu Yasal Metin Kimleri Kapsar ve Rol Dağılımı Nedir?
          </h2>
          <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
            <p>
              RANDEVORY iki taraflı dijital bir bulut platformudur ve işlenen verinin niteliğine göre hukuki sıfatlar değişir:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Kayıtlı Müşteriler:</strong> Platformda hesap açarak işletmelerden online randevu oluşturan kişiler. Hesap güvenliği ve platform üyelik verileri bakımından RANDEVORY Veri Sorumlusudur; randevu alınan hizmet ve dükkan detayları bakımından ilgili İşletme Veri Sorumlusudur.
              </li>
              <li>
                <strong>İşletme Sahipleri:</strong> Platformda işletme hesabı oluşturan, takvimini yöneten ve lisans paketi satın alan kişiler. İşletme profil ve faturalandırma verileri bakımından RANDEVORY Veri Sorumlusudur.
              </li>
              <li>
                <strong>Personel (Çalışanlar):</strong> Bir işletmenin RANDEVORY paneline eklediği, randevu atanabilen uzmanlar ve çalışanlar. Personel verilerinin (ad, telefon, uzmanlık, komisyon, çalışma ve izin kayıtları) Veri Sorumlusu ilgili İşletmedir; RANDEVORY yalnızca teknik Veri İşleyendir.
              </li>
              <li>
                <strong>Hesapsız Müşteriler (Walk-in / Telefon Randevuları):</strong> Platformda şahsi hesabı bulunmayan ancak işletme tarafından telefonla, kapıdan veya manuel olarak randevu takvimine kaydedilen müşteriler. Bu kişilerin verileri bakımından <strong>doğrudan ve münhasıran ilgili İşletme Veri Sorumlusudur</strong>. RANDEVORY, işletmenin talimatı ve yetkilendirmesiyle hareket eden teknik Veri İşleyen konumundadır; bu verileri kendi adına analiz veya pazarlama amacıyla kesinlikle kullanmaz.
              </li>
              <li>
                <strong>Ziyaretçiler:</strong> Web sitesini ziyaret eden, işletme profillerini inceleyen veya canlı destek/iletişim formunu kullanan kişiler.
              </li>
            </ul>
          </div>
        </section>

        {/* 2. Platform Sorumluluk Sınırları */}
        <section id="sorumluluk" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Scale className="w-5 h-5 text-brand-600 shrink-0" />
            2. Platform Kullanıcı Sözleşmesi ve Teknik Altyapı Sorumluluk Sınırları
          </h2>
          <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
            <p>
              <strong>2.1. Teknik Altyapı ve Yer Sağlayıcı Statüsü:</strong> <strong>RANDEVORY</strong> (<code>https://www.randevory.com</code>), randevu ve rezervasyonla çalışan işletmelerin (kuaför, berber, güzellik merkezi, klinik, restoran, danışmanlık vb.) kendi hizmet, personel, takvim ve çalışma saatlerini dijital ortamda yönetebilmelerini sağlayan bulut tabanlı bir <strong>yazılım altyapı sağlayıcısı (SaaS)</strong> ve 5651 sayılı Kanun kapsamında <strong>&ldquo;Yer Sağlayıcı&rdquo;</strong>dır. RANDEVORY, üye işletmelerin ifa ettiği hiçbir fiziksel ya da mesleki hizmetin doğrudan sağlayıcısı, satıcısı, bayisi, acentesi veya iş ortağı değildir.
            </p>
            <p>
              <strong>2.2. Hizmet Ayıpları ve Tüketici Sorumluluğu:</strong> Randevu alan son kullanıcı (müşteri) ile randevuyu veren üye işletme arasındaki hukuki ilişki tamamen ilgili taraflar arasındadır. Sunulan hizmetin kalitesi, ayıplı veya eksik ifa edilmesi, hijyen ve sağlık standartları, randevu saatinde gecikmeler veya iptaller, işletmede meydana gelebilecek bedeni veya maddi zararlar, fiyatlandırma, adisyon tahsilatı ve fiş/fatura düzenleme yükümlülüğü <strong>münhasıran ilgili İşletmeye aittir</strong>. 6502 sayılı Tüketicinin Korunması Hakkında Kanun kapsamında tek muhatap işletmedir; RANDEVORY bu uyuşmazlıklarda hiçbir hukuki, idari, cezai veya mali sorumluluk kabul etmez.
            </p>
            <p>
              <strong>2.3. İçerik ve Profil Güvenliği:</strong> İşletmeler kendi sayfalarında yayınladıkları dükkan adı, logo, adres, personel bilgisi, hizmet açıklamaları ve fiyatların doğruluğundan tek başına sorumludur. Üçüncü şahısların fikri mülkiyet haklarını, kişilik haklarını ihlal eden veya yasa dışı unsurlar içeren hesaplar derhal askıya alınır veya kapatılır.
            </p>
            <p>
              <strong>2.4. Hizmet Sürekliliği ve Azami Sorumluluk Sınırı:</strong> RANDEVORY, sistemin 7/24 kesintisiz çalışması için gerekli teknik tedbirleri alır. Ancak internet servis sağlayıcı arızaları, telekomünikasyon kesintileri, siber saldırılar veya mücbir sebeplerden ötürü yaşanabilecek geçici kesintilerden veya veri kaybından doğabilecek dolaylı zararlardan RANDEVORY sorumlu tutulamaz. Her halükarda RANDEVORY&apos;nin toplam hukuki sorumluluğu, ilgili işletmenin son 1 (bir) ayda platforma ödediği net lisans bedeli ile sınırlıdır.
            </p>
          </div>
        </section>

        {/* 3. Personel Güvenliği ve Müşteri Numara Gizliliği (TCK 135 Zırhı) */}
        <section id="personel-guvenlik" className="bg-rose-50/50 p-6 sm:p-8 rounded-2xl border border-rose-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            3. İşletme ve Personel Gizlilik Taahhüdü: Müşteri Verilerinin Şahsi Amaçla Kullanımı Yasağı
          </div>
          <div className="text-xs text-rose-950 space-y-3 leading-relaxed">
            <p className="bg-white p-3.5 rounded-xl border border-rose-200 text-rose-900 font-medium shadow-2xs">
              <strong>ÖNEMLİ HUKUKİ UYARI:</strong> Bu madde, platformda randevu oluşturan müşterilerin kişisel iletişim bilgilerini (telefon, isim, e-posta) personellerin kötüye kullanımına ve rahatsızlık vermesine karşı kanuni koruma altına alır.
            </p>
            <p>
              <strong>3.1. Veri Kullanımının Sınırlandırılması:</strong> Üye işletmeler ve personelleri, RANDEVORY yönetim paneli üzerinden eriştikleri müşteri cep telefonu numaralarını ve kimlik bilgilerini <strong>yalnızca ve münhasıran ilgili randevunun ifası, teyidi veya randevu iptali amacıyla</strong> kullanmakla yükümlüdür.
            </p>
            <p>
              <strong>3.2. Şahsi İletişim ve Taciz Yasağı (TCK 135-138):</strong> İşletme çalışanlarının veya işletme yetkililerinin, sistemde kayıtlı müşterilerin iletişim bilgilerini şahsi rehberlerine kaydetmesi, müşterinin açık rızası olmaksızın şahsi amaçlarla araması, WhatsApp veya SMS yoluyla şahsi mesaj atması, rahatsız etmesi veya üçüncü şahıslara aktarması <strong>kesinlikle yasaktır</strong>.
            </p>
            <p>
              <strong>3.3. Doğrudan Cezai Sorumluluk ve Rücu Kaydı:</strong> Böyle bir eylemin gerçekleşmesi durumunda; 5237 sayılı Türk Ceza Kanunu Madde 135 (Kişisel Verilerin Kaydedilmesi), Madde 136 (Verileri Hukuka Aykırı Olarak Verme veya Ele Geçirme) ve 6698 sayılı KVKK kapsamındaki tüm <strong>cezai, hukuki ve tazminat sorumluluğu doğrudan fiili işleyen personele ve personeli istihdam eden İşletmeye aittir</strong>. RANDEVORY&apos;ye bu fiiller nedeniyle herhangi bir idari para cezası kesilmesi, dava açılması veya tazminata hükmedilmesi halinde; RANDEVORY ödemek zorunda kalacağı tüm bedelleri fer&apos;ileri, faiz ve avukatlık vekalet ücreti ile birlikte ilgili İşletmeye <strong>derhal ve rücuen tahsil etme hakkına sahiptir</strong>.
            </p>
          </div>
        </section>

        {/* 4. SMS & Ticari Elektronik İleti Şartları (ETK & İYS) */}
        <section id="sms-etk" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-amber-600 shrink-0" />
            4. SMS Bildirimleri ve Ticari Elektronik İleti (ETK & İYS) Kuralları
          </h2>
          <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
            <p>
              <strong>4.1. İşlemsel İleti (Transactional SMS) Esası:</strong> RANDEVORY platformu üzerinden müşterilere gönderilen 4 haneli SMS onay kodları (OTP), randevu oluşturma onayları, randevu hatırlatmaları ve randevu iptal bildirimleri; 6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun uyarınca <strong>&ldquo;İşlemsel İleti&rdquo; (sözleşmenin ifası ve hizmet bilgilendirmesi)</strong> niteliğindedir ve İleti Yönetim Sistemi (İYS) onayına tabi değildir.
            </p>
            <p>
              <strong>4.2. Reklam ve Kampanya Mesajı Gönderme Yasağı:</strong> Üye işletmelerin, RANDEVORY SMS altyapısını veya elde ettikleri müşteri numaralarını kullanarak müşterilerin İYS üzerinden alınmış açık ticari iletisi izni bulunmaksızın reklam, kampanya, promosyon veya indirim içerikli SMS/mesaj göndermesi <strong>yasaktır</strong>.
            </p>
            <p>
              <strong>4.3. Bakanlık Cezalarına Karşı Sorumluluk:</strong> İşletmelerin bu kurala aykırı şekilde mevzuata aykırı ticari elektronik ileti göndermesi neticesinde Ticaret Bakanlığı veya yetkili merciler tarafından kesilebilecek tüm idari para cezalarından münhasıran ilgili İşletme sorumludur; RANDEVORY bu konuda hiçbir sorumluluk üstlenmez.
            </p>
          </div>
        </section>

        {/* 5. KVKK Aydınlatma Metni & Yurtdışı Aktarım */}
        <section id="kvkk" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-600 shrink-0" />
            <h2 className="text-lg font-bold text-slate-900">
              5. 6698 Sayılı KVKK Kapsamlı Aydınlatma Metni ve Açık Rıza Esasları
            </h2>
          </div>

          <div className="text-xs text-slate-600 space-y-4 leading-relaxed">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <h3 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-1">
                5.1. Veri Sorumlusu ve Veri İşleyen Sıfatı Ayrımı
              </h3>
              <p>
                6698 sayılı Kişisel Verilerin Korunması Kanunu (&ldquo;KVKK&rdquo;) uyarınca:
                <br />• <strong>İşletme Sahipleri ve Platform Üyeleri Bakımından:</strong> RANDEVORY&apos;ye üye olan işletme sahiplerinin hesap açılış ve faturalandırma bilgileri bakımından <strong>RANDEVORY &ldquo;Veri Sorumlusu&rdquo;</strong>dur.
                <br />• <strong>Randevu Alan Müşteriler ve Hesapsız Müşteriler Bakımından:</strong> Randevu alırken girilen veya işletme tarafından sisteme kaydedilen müşteri verileri bakımından randevu alınan <strong>ilgili İşletme &ldquo;Veri Sorumlusu&rdquo;</strong>, RANDEVORY ise verileri yalnızca işletme adına güvenli bulut ortamında barındıran ve teknik aktarımı sağlayan <strong>&ldquo;Veri İşleyen&rdquo;</strong> konumundadır.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-1">
                5.2. İşlenen Kişisel Veri Kategorileri ve İşleme Amaçları
              </h3>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Kimlik Verisi:</strong> Ad, Soyad (Hesap oluşturma, randevu eşleştirme ve kimlik doğrulama).</li>
                <li><strong>İletişim Verisi:</strong> Telefon numarası, E-posta adresi, İşletme adresi (Randevu onay SMS&apos;leri, şifre sıfırlama, bildirimler ve destek süreçleri).</li>
                <li><strong>Randevu ve İşlem Verisi:</strong> Alınan hizmet, randevu tarih ve saati, uzman tercihi, randevu notları, tutar bilgisi (Takvim yönetimi, çakışma önleme motoru ve işletme raporlaması).</li>
                <li><strong>İşlem Güvenliği ve Trafik Verisi:</strong> IP adresi, oturum açma/kapatma logları, tarayıcı bilgisi (5651 sayılı Kanun kapsamındaki yasal log tutma yükümlülüğü ve siber güvenlik).</li>
                <li><strong>Müşteri Destek ve Canlı Sohbet Verisi:</strong> Canlı destek görüşme kayıtları, geri bildirim ve memnuniyet puanları (Müşteri destek süreçlerinin yürütülmesi ve hizmet kalitesinin artırılması).</li>
              </ul>
            </div>

            {/* Özel Nitelikli Kişisel Veriler (Madde 6) */}
            <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200">
              <h3 className="font-bold text-rose-950 text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-700" />
                5.3. Özel Nitelikli Kişisel Veriler (KVKK Madde 6)
              </h3>
              <p className="text-rose-900">
                RANDEVORY, kullanıcılardan kendi amaçları doğrultusunda sağlık, genetik, biyometrik, siyasi düşünce veya inanç gibi <strong>özel nitelikli kişisel veri kesinlikle talep etmez</strong>. Bir işletmenin müşteri kartına, randevu notuna (örneğin alerji, hamilelik, hassasiyet vb.) veya personel izin kaydına (örneğin hastalık raporu) sağlık durumuna ilişkin bilgi girmesi halinde; bu verilerin veri sorumlusu münhasıran ilgili İşletmedir. RANDEVORY bu verileri yalnızca işletmenin talimatı doğrultusunda güvenli biçimde saklar; hiçbir analiz, profilleme veya pazarlama amacıyla kullanmaz.
              </p>
            </div>

            {/* Yurtdışına Veri Aktarımı */}
            <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-200">
              <h3 className="font-bold text-indigo-950 text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-indigo-700" />
                5.4. Yurtdışına Veri Aktarımı ve Aktarım Yapılan Sağlayıcılar (KVKK Madde 9 Uyumu)
              </h3>
              <p className="text-indigo-900 mb-2">
                RANDEVORY platformu, yüksek erişilebilirlik ve kesintisiz güvenlik standartlarını temin etmek üzere aşağıdaki uluslararası ve yerli teknik hizmet sağlayıcılarla çalışmaktadır:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-indigo-950 font-medium">
                <li><strong>Shopier Ödeme Hizmetleri (Türkiye):</strong> Lisans paketlerinin 3D Secure güvencesiyle tahsili. Kart bilgileri RANDEVORY sunucularına asla uğramaz ve kaydedilmez.</li>
                <li><strong>Supabase / AWS (Frankfurt, Almanya - Avrupa Birliği):</strong> Platform veritabanının, müşteri ve işletme kayıtlarının 256-bit SSL şifrelemeyle güvenli barındırılması ve felaket kurtarma yedeklemesi.</li>
                <li><strong>Google Cloud & Gemini API (Global):</strong> Canlı destek masasında yapay zeka destekli müşteri temsilcisi asistanlığı.</li>
                <li><strong>Netgsm & SMS Servis Sağlayıcıları (Türkiye):</strong> OTP doğrulama ve randevu teyit SMS&apos;lerinin iletilmesi.</li>
                <li><strong>Yetkili Adli ve İdari Merciler:</strong> 5651 sayılı Kanun ve mahkeme müzekkereleri uyarınca kanuni yükümlülüklerin yerine getirilmesi.</li>
              </ul>
            </div>

            {/* Randevu Sadakati ve No-Show Listesi */}
            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200">
              <h3 className="font-bold text-amber-950 text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                5.5. Randevu Sadakati ve Randevu Kabul Kısıtlaması (Hizmet Güvenlik Listesi)
              </h3>
              <p className="text-amber-900">
                İşletmelerin randevu kapasitesinin kötüye kullanılmasını ve mazeretsiz gelinmeyen randevular (No-Show) sebebiyle oluşan ticari zararları önlemek amacıyla; işletmeler kendi meşru menfaatleri kapsamında geçmişte randevusuna mazeretsiz katılmayan müşterilere yönelik randevu oluşturma kısıtlaması (hizmet güvenlik listesi) uygulayabilir. Bu işlem tamamen ilgili işletmenin kendi tasarrufunda olup, kısıtlama kararına itirazlar doğrudan ilgili işletmeye yöneltilmelidir.
              </p>
            </div>

            {/* Hesap Silme ve Anonimleştirme */}
            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
              <h3 className="font-bold text-emerald-950 text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                5.6. Hesap Kapatma, Veri Silme ve Anonimleştirme Esasları
              </h3>
              <p className="text-emerald-900">
                Kullanıcı hesabını kapattığında veya verilerinin silinmesini talep ettiğinde; kişisel kimlik ve iletişim bilgileri sistemden silinir veya anonim hale getirilir. İşletmelerin geçmiş ciro, muhasebe ve randevu istatistiklerinin bütünlüğünü korumak amacıyla geçmiş randevu kayıtlarındaki kişi bilgileri kimliksizleştirilir (bağlantısı koparılır). Yapılan kamuya açık yorum ve puanlamalar ise &ldquo;Silinmiş Kullanıcı&rdquo; unvanıyla sistemde yayında kalmaya devam eder.
              </p>
            </div>

            {/* Veri Saklama Süreleri Tablosu */}
            <div>
              <h3 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-600" />
                5.7. Veri Saklama ve İmha Süreleri Tablosu
              </h3>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Veri Kategorisi</th>
                      <th className="p-2.5">Saklama Süresi</th>
                      <th className="p-2.5">Yasal Dayanak / Amaç</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white text-slate-600">
                    <tr>
                      <td className="p-2.5 font-semibold">İşletme Üyelik ve Lisans Kayıtları</td>
                      <td className="p-2.5">Üyelik süresince + 10 Yıl</td>
                      <td className="p-2.5">Türk Ticaret Kanunu & Vergi Usul Kanunu</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold">Randevu ve Müşteri Hareket Kayıtları</td>
                      <td className="p-2.5">Randevu tarihinden itibaren 3 Yıl (Sonrasında Anonim)</td>
                      <td className="p-2.5">Sözleşmenin ifası ve uyuşmazlık zamanaşımı</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold">İnternet Trafik & IP Logları</td>
                      <td className="p-2.5">2 Yıl</td>
                      <td className="p-2.5">5651 Sayılı Kanun (Yasal Log Zorunluluğu)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold">Canlı Destek & Puanlama Kayıtları</td>
                      <td className="p-2.5">1 Yıl</td>
                      <td className="p-2.5">Hizmet kalitesi ve denetim meşru menfaati</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold">SMS Gönderim ve Doğrulama Logları</td>
                      <td className="p-2.5">1 Yıl</td>
                      <td className="p-2.5">Elektronik Haberleşme ve ETK denetimi</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Başvuru Şartları (Tebliğ Uyumu) */}
            <div>
              <h3 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-1">
                5.8. Veri Sahibinin Hakları ve Yasal Başvuru Şartları (KVKK Madde 11)
              </h3>
              <p className="mb-2">
                Kişisel veri sahipleri; kişisel verilerinin işlenip işlenmediğini öğrenme, işlenmişse buna ilişkin bilgi talep etme, eksik veya yanlış işlenmişse düzeltilmesini isteme, kanuni şartlar çerçevesinde silinmesini (unutulma hakkı) talep etme haklarına sahiptir.
              </p>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                <p className="font-semibold text-[11px] mb-1">Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ Uyarınca Zorunlu Başvuru Unsurları:</p>
                <p>
                  Başvurunuzda ad-soyadınızın, başvuru yazılı ise ıslak imzanızın, T.C. kimlik numaranızın (yabancı uyruklular için pasaport numarası), tebligata esas yerleşim yeri veya iş yeri adresinizin ve talep konunuzun bulunması mevzuat gereği zorunludur. Başvurularınızı kayıtlı e-postanız üzerinden <code>kvkk@randevory.com</code> adresine veya noter aracılığıyla resmi tebligat adresimize iletebilirsiniz. Başvurularınız en geç 30 (otuz) gün içerisinde ücretsiz olarak sonuçlandırılacaktır.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Çerez Politikası */}
        <section id="cerez" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Cookie className="w-5 h-5 text-amber-600 shrink-0" />
            6. Çerez (Cookie) ve Yerel Depolama Politikası
          </h2>
          <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
            <p>
              RANDEVORY, web sitesinin temel teknik işlevlerini yerine getirebilmesi, kullanıcı oturumlarının güvenle sürdürülebilmesi ve platform tercihlerinizin hatırlanabilmesi amacıyla zorunlu çerezler ve yerel depolama (LocalStorage) teknolojileri kullanır:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Zorunlu / Teknik Çerezler:</strong> Güvenli kullanıcı girişi (Supabase Auth token), oturum sürekliliği ve CSRF ataklarına karşı güvenlik çerezleridir. Bu çerezler olmadan sitenin çalışması teknik olarak mümkün değildir.</li>
              <li><strong>İşlevsellik Çerezleri:</strong> Canlı destek sohbet penceresi durumu, bildirim tercihleri ve tema ayarları gibi kullanıcı deneyimini kolaylaştıran veriler yerel tarayıcınızda tutulur.</li>
              <li><strong>Reklam Çerezi Kullanılmaz:</strong> RANDEVORY web sitesinde kullanıcıları üçüncü taraf sitelerde takip eden harici hedefleme veya reklam çerezleri <strong>kesinlikle kullanılmamaktadır</strong>.</li>
            </ul>
          </div>
        </section>

        {/* 7. Mesafeli Lisans Sözleşmesi (GÜNCEL FİYATLAR) */}
        <section id="hizmet-sozlesmesi" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-600 shrink-0" />
            7. Mesafeli Satış ve Dijital Yazılım Lisans Sözleşmesi
          </h2>
          <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
            <p>
              <strong>7.1. Taraflar ve Konu:</strong> İşbu sözleşme, RANDEVORY ile platformdaki dijital yazılım lisans paketlerini satın alan üye işletme arasında akdedilmiştir. Platformdaki güncel lisans paketleri şunlardır:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 my-2 text-slate-800">
              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                <div className="font-bold text-slate-900">Ücretsiz Başlangıç</div>
                <div className="text-brand-600 font-extrabold text-sm mt-0.5">0 ₺ / ay</div>
                <div className="text-[10px] text-slate-500">1 Personel, 5 Hizmet, 50 Randevu</div>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                <div className="font-bold text-slate-900">Standart Paket</div>
                <div className="text-brand-600 font-extrabold text-sm mt-0.5">149 ₺ / ay</div>
                <div className="text-[10px] text-slate-500">3 Personel, 20 Hizmet, 300 Randevu</div>
              </div>
              <div className="p-2.5 rounded-lg border border-brand-200 bg-brand-50/40">
                <div className="font-bold text-slate-900">Profesyonel Paket</div>
                <div className="text-brand-600 font-extrabold text-sm mt-0.5">299 ₺ / ay</div>
                <div className="text-[10px] text-slate-500">10 Personel, 100 Hizmet, 1.500 Randevu</div>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                <div className="font-bold text-slate-900">Kurumsal Paket</div>
                <div className="text-brand-600 font-extrabold text-sm mt-0.5">599 ₺ / ay</div>
                <div className="text-[10px] text-slate-500">Sınırsız Personel, Hizmet ve Randevu</div>
              </div>
            </div>
            <p>
              <strong>7.2. Dijital Hizmetin Anında Teslimi:</strong> Satın alınan yazılım paketleri fiziksel kargo gerektirmeyen, internet üzerinden anında aktive edilen dijital SaaS lisans hizmetidir. Shopier 3D Secure güvenli ödeme altyapısı üzerinden ödeme onaylandığı anda ilgili lisans limitleri işletme hesabına otomatik tanımlanır.
            </p>
            <p>
              <strong>7.3. Fiyat Değişiklikleri:</strong> RANDEVORY lisans paketlerinin fiyatlarını veya kampanya koşullarını önceden bildirmek kaydıyla güncelleme hakkını saklı tutar. Fiyat güncellemeleri mevcut aktif abonelik dönemini etkilemez; bir sonraki yenileme döneminde geçerli olur.
            </p>
          </div>
        </section>

        {/* 8. İptal ve İade Şartları */}
        <section id="iptal-iade" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <RefreshCcw className="w-5 h-5 text-emerald-600 shrink-0" />
            8. Abonelik İptali, Cayma Hakkı İstisnası ve İade Şartları
          </h2>
          <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
            <p>
              <strong>8.1. Taahhütsüz Model:</strong> RANDEVORY yazılım lisans paketlerinde uzun süreli taahhüt mecburiyeti yoktur. İşletmeler diledikleri zaman aboneliklerini yenilememe veya sonlandırma hakkına sahiptir.
            </p>
            <p>
              <strong>8.2. Cayma Hakkının İstisnası:</strong> 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği Madde 15/1-ğ bendi uyarınca; <em>&ldquo;Elektronik ortamda anında ifa edilen hizmetler veya tüketiciye anında teslim edilen gayrimaddi mallara ilişkin sözleşmelerde cayma hakkı kullanılamaz.&rdquo;</em> Lisans paketi hesaba tanımlanıp sistem kullanılmaya başlandıktan sonra cayma hakkı kapsamında keyfi iade talep edilemez.
            </p>
            <p>
              <strong>8.3. Teknik Kusur ve Mükerrer Tahsilat:</strong> Platformdan kaynaklanan kronik teknik bir arıza nedeniyle hizmetin hiç verilememesi veya mükerrer çekim gerçekleşmesi durumunda, 14 gün içerisinde yapılan başvurular incelenerek onaylanan tutarlar kesintisiz iade edilir.
            </p>
          </div>
        </section>

        {/* 9. Fikri Mülkiyet & Yetkili Mahkeme */}
        <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Building className="w-5 h-5 text-brand-600 shrink-0" />
            9. Fikri Mülkiyet, Uygulanacak Hukuk ve Yetkili Yargı Mercii
          </h2>
          <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
            <p>
              <strong>9.1. Fikri ve Sınai Mülkiyet:</strong> RANDEVORY markası, logosu, arayüz tasarımları, yazılım kaynak kodları, veri tabanı mimarisi ve tüm grafik içerikler 5846 sayılı FSEK ve 6769 sayılı Sınai Mülkiyet Kanunu kapsamında korunmaktadır. İzinsiz kopyalanamaz, çoğaltılamaz veya tersine mühendislikle kopyası üretilemez.
            </p>
            <p>
              <strong>9.2. Uygulanacak Hukuk ve Mahkemeler:</strong> İşbu yasal şartların yorumlanmasında ve uygulanmasında Türk Hukuku geçerlidir. Taraflar arasında doğabilecek her türlü uyuşmazlığın çözümünde <strong>İstanbul (veya davanın açıldığı tarihte veri sorumlusunun ikametgahındaki) Tüketici Hakem Heyetleri, Tüketici Mahkemeleri ve İcra Daireleri</strong> yetkilidir.
            </p>
          </div>
        </section>

        {/* 10. Resmi İletişim & Künye */}
        <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-600 shrink-0" />
            10. Resmi İletişim, Künye ve KVKK Başvuru Kanalları
          </h2>
          <div className="text-xs text-slate-600 space-y-2.5">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-400 shrink-0" />
              <span><strong>Resmi Web Sitesi:</strong> https://www.randevory.com</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span><strong>Resmi Destek E-posta:</strong> destek@randevory.com</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-400 shrink-0" />
              <span><strong>KVKK ve Veri Sahibi Hakları Başvuru:</strong> kvkk@randevory.com</span>
            </div>
            <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
              * İşletme unvanı, ticari sicil ve resmi tebligat adresi bilgileri şirketleşme ve tescil süreçlerine paralel olarak güncellenmekte olup resmi tebligatlar ve bildirimler yukarıdaki resmi elektronik posta kanalları üzerinden kabul edilmektedir.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <BrandLogo size="sm" variant="dark" showSlogan={true} />
          <span>&copy; {new Date().getFullYear()} RANDEVORY. Tüm hakları saklıdır.</span>
        </div>
      </footer>
    </div>
  );
}
