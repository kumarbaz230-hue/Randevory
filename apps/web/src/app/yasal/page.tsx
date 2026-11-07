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
} from 'lucide-react';

export default function LegalTermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/95 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <BrandLogo size="sm" showBadge={true} showSlogan={false} />
          <Link
            href="/"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Ana Sayfaya Dön
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 flex-1">
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
            Yasal Metinler, KVKK ve Sorumluluk Sınırları
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Kullanıcı Sözleşmesi, KVKK Aydınlatma Metni ve Hukuki Şartlar
          </h1>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Son Güncelleme: {new Date().toLocaleDateString('tr-TR')} • Bu metinler hem <strong>RANDEVORY</strong> platformunu, hem üye işletmeleri hem de randevu alan son kullanıcıları yasal olarak korumak ve haklarını şeffafça belirlemek amacıyla hazırlanmıştır.
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <a href="#sorumluluk" className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold">
              1. Platform Sorumluluk Sınırları
            </a>
            <a href="#kvkk" className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold">
              2. KVKK Aydınlatma ve Açık Rıza
            </a>
            <a href="#hizmet-sozlesmesi" className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold">
              3. Mesafeli Lisans Sözleşmesi
            </a>
            <a href="#iptal-iade" className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold">
              4. İptal ve İade Şartları
            </a>
          </div>
        </div>

        {/* 1. Platformun Hukuki Konumu ve Sorumluluk Reddi */}
        <section id="sorumluluk" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Scale className="w-5 h-5 text-brand-600" />
            1. Kullanıcı Sözleşmesi ve Platform Sorumluluk Sınırları
          </h2>
          <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
            <p>
              <strong>1.1. Teknik Altyapı Sağlayıcı Konumu:</strong> <strong>RANDEVORY</strong> (<code>https://www.randevory.com</code>), randevulu çalışan işletmelerin kendi randevu takvimlerini, hizmetlerini ve personellerini dijital ortamda yönetebilmelerini sağlayan bulut tabanlı bir <strong>yazılım altyapısı sağlayıcısıdır (SaaS / Yer Sağlayıcı)</strong>. RANDEVORY, üye işletmelerin sunduğu hizmetlerin doğrudan satıcısı, sağlayıcısı, acentesi veya ortağı değildir.
            </p>
            <p>
              <strong>1.2. İşletme ve Müşteri Arasındaki İlişki:</strong> Randevu alan müşteri ile randevu veren işletme arasındaki hizmet ilişkisi tamamen ilgili işletme ve müşteri arasındadır. İşletmenin sunduğu hizmetin kalitesi, hijyen ve güvenlik standartları, zamanında ifa edilmemesi, randevunun işletme veya müşteri tarafından iptal edilmesi, işletmede yaşanabilecek maddi/manevi kayıplar veya işletme ile müşteri arasındaki ücret tahsilatı ve fatura/fiş düzenleme yükümlülüklerinden <strong>ilgili İşletme bizzat sorumludur; RANDEVORY bu uyuşmazlıklarda hiçbir hukuki, cezai veya mali sorumluluk kabul etmez.</strong>
            </p>
            <p>
              <strong>1.3. İçerik ve Kullanım Sorumluluğu:</strong> Üye işletmeler; kendi sayfalarında yayınladıkları işletme adı, adres, telefon, fiyat, hizmet açıklamaları ve personel bilgilerinin doğruluğundan ve yürürlükteki Türk mevzuatına uygunluğundan tek başına sorumludur. Yasa dışı, yanıltıcı veya üçüncü kişilerin haklarını ihlal eden içerik tespit edilmesi halinde RANDEVORY ilgili işletme hesabını askıya alma veya kapatma hakkını saklı tutar.
            </p>
            <p>
              <strong>1.4. Hizmet Sürekliliği ve Sorumluluk Sınırı:</strong> RANDEVORY, yazılımın kesintisiz çalışması için azami teknik özeni gösterir. Ancak siber saldırılar, internet servis sağlayıcı kesintileri, mücbir sebepler veya bakım çalışmaları nedeniyle oluşabilecek geçici erişim kesintilerinden, dolaylı zararlardan veya kar kaybından dolayı RANDEVORY&apos;nin sorumluluğu, her halükarda ilgili işletmenin son 1 (bir) ayda platforma ödediği yazılım lisans bedeli ile sınırlıdır.
            </p>
          </div>
        </section>

        {/* 2. 6698 Sayılı KVKK Aydınlatma Metni ve Açık Rıza Beyanı */}
        <section id="kvkk" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-600" />
            2. 6698 Sayılı KVKK Aydınlatma Metni ve Açık Rıza Beyanı
          </h2>
          <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
            <p>
              <strong>2.1. Veri Sorumlusu ve Veri İşleyen Sıfatı:</strong> 6698 sayılı Kişisel Verilerin Korunması Kanunu (&ldquo;KVKK&rdquo;) uyarınca:
              <br />• Platforma üye olan <strong>İşletme Sahiplerinin</strong> üyelik bilgileri bakımından RANDEVORY &ldquo;Veri Sorumlusu&rdquo;dur.
              <br />• İşletmelerin kendi müşterilerine ait kaydettiği veya müşterilerin işletmeden randevu alırken girdiği veriler (Ad Soyad, Telefon, E-posta, Randevu Notu) bakımından ise <strong>randevu alınan ilgili İşletme &ldquo;Veri Sorumlusu&rdquo;</strong>, RANDEVORY ise yalnızca teknik barındırma sağlayan <strong>&ldquo;Veri İşleyen&rdquo;</strong> konumundadır. İşletmeler, kendi müşterilerinin verilerini KVKK&apos;ya uygun kullanmayı ve üçüncü kişilerle hukuka aykırı paylaşmamayı taahhüt eder.
            </p>
            <p>
              <strong>2.2. İşlenen Kişisel Veriler ve İşleme Amaçları:</strong> Kimlik bilgileri (Ad, Soyad), İletişim bilgileri (Telefon numarası, E-posta adresi, İşletme adresi), Randevu bilgileri (Seçilen hizmet, tarih, saat, uzman tercihi ve müşteri notu) ve İşlem Güvenliği bilgileri;
              <br />• Üyelik kaydının oluşturulması ve kimlik doğrulaması,
              <br />• Online randevuların oluşturulması, çakışmaların önlenmesi ve ilgili işletmeye iletilmesi,
              <br />• Randevu onay/bilgilendirme mesajlarının iletilmesi ve müşteri destek süreçlerinin yürütülmesi,
              <br />• 5651 sayılı Kanun ve ilgili mevzuat kapsamındaki yasal yükümlülüklerin yerine getirilmesi
              amaçlarıyla KVKK Madde 5/2 (sözleşmenin kurulması ve ifası, hukuki yükümlülük, meşru menfaat) ve açık rızanız kapsamında işlenmektedir.
            </p>
            <p>
              <strong>2.3. Verilerin Aktarımı ve Güvenliği:</strong> Kişisel verileriniz, randevu aldığınız işletmenin yetkili personeliyle paylaşılır ve güvenli bulut veritabanı ile e-posta/ödeme altyapısı sağlayıcıları üzerinden 256-bit SSL şifreleme ile korunur. Verileriniz üçüncü kişilere reklam veya pazarlama amacıyla <strong>kesinlikle satılmaz.</strong>
            </p>
            <p>
              <strong>2.4. KVKK Madde 11 Kapsamındaki Haklarınız:</strong> Veri sahipleri diledikleri zaman <code>noreply@randevory.com</code> adresine başvurarak; verilerinin işlenip işlenmediğini öğrenme, düzeltilmesini veya silinmesini (unutulma hakkı) talep etme hakkına sahiptir.
            </p>
          </div>
        </section>

        {/* 3. Mesafeli Hizmet ve Yazılım Lisans Sözleşmesi */}
        <section id="hizmet-sozlesmesi" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-600" />
            3. Mesafeli Satış ve Dijital Yazılım Lisans Sözleşmesi
          </h2>
          <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
            <p>
              <strong>3.1. Konu ve Kapsam:</strong> İşbu sözleşmenin konusu, RANDEVORY tarafından sunulan Online Randevu ve İşletme Yönetim Yazılımının dijital abonelik paketlerinin (Ücretsiz Başlangıç, Standart Paket: 399 ₺/ay, Profesyonel Paket: 799 ₺/ay, Kurumsal Paket: 1.499 ₺/ay) elektronik ortamda satışı ve kullanım şartlarının belirlenmesidir.
            </p>
            <p>
              <strong>3.2. Dijital Teslimat:</strong> Satın alınan yazılım lisans paketleri fiziksel kargo gerektirmeyen, elektronik ortamda anında ifa edilen dijital hizmet niteliğindedir. Ödeme işleminin Shopier 3D Secure güvenli ödeme altyapısı üzerinden onaylanmasının ardından lisans hakları (personel limiti, hizmet tanım limiti ve aylık randevu kotası) işletme hesabına anında tanımlanır.
            </p>
          </div>
        </section>

        {/* 4. İptal ve İade Koşulları */}
        <section id="iptal-iade" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <RefreshCcw className="w-5 h-5 text-emerald-600" />
            4. Abonelik İptali ve İade Koşulları
          </h2>
          <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
            <p>
              <strong>4.1. Taahhütsüz Kullanım:</strong> RANDEVORY lisans paketlerinde uzun süreli taahhüt zorunluluğu bulunmamaktadır. İşletme sahipleri diledikleri zaman aboneliklerini sonlandırabilir veya bir sonraki dönem için yenilememe kararı alabilirler.
            </p>
            <p>
              <strong>4.2. Dijital Hizmet İade Şartları:</strong> Mesafeli Sözleşmeler Yönetmeliği Madde 15/1-ğ uyarınca elektronik ortamda anında ifa edilen dijital yazılım hizmetlerinde lisans aktif edilip kullanılmaya başlandıktan sonra cayma hakkı kapsamı dışındadır; ancak sistem kaynaklı teknik bir kusur veya mükerrer çekim olması halinde 14 gün içerisinde yapılan başvurular incelenerek kesintisiz iade gerçekleştirilir.
            </p>
          </div>
        </section>

        {/* 5. İletişim */}
        <section id="iletisim" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-600" />
            5. İletişim ve Hukuki Bildirim Kanalı
          </h2>
          <div className="text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-400" />
              <span><strong>Resmi Web Sitesi:</strong> https://www.randevory.com</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" />
              <span><strong>Resmi İletişim & KVKK Başvuru E-posta:</strong> noreply@randevory.com</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <BrandLogo size="sm" variant="dark" showSlogan={true} />
          <span>&copy; {new Date().getFullYear()} RANDEVORY. Tüm hakları saklıdır.</span>
        </div>
      </footer>
    </div>
  );
}
