import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';
import { HomeHeader } from '@/components/home-header';
import { ReviewsSection } from '@/components/reviews-section';
import { PricingSection } from '@/components/pricing-section';
import { SmoothScrollProvider } from '@/components/smooth-scroll-provider';
import { HeroShowcaseMockup } from '@/components/hero-showcase-mockup';
import { SectorLiveSimulator } from '@/components/sector-live-simulator';
import {
  ArrowRight,
  Calendar,
  Clock,
  MessageSquare,
  QrCode,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

export default function HomePage() {
  return (
    <SmoothScrollProvider>
      <div className="flex flex-col min-h-screen bg-[#f5f4ef] text-stone-900">
        {/* Top Navbar & Mobile Quick Nav */}
        <HomeHeader />

        {/* Editorial Scene Hero */}
        <section className="pt-12 pb-16 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24 bg-[#f5f4ef] border-b border-stone-900/10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl text-left">
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-stone-500 mb-5">
                <span>Randevu ve işletme yönetimi</span>
                <span>·</span>
                <a href="#yorumlar" className="text-stone-700 hover:text-stone-900 transition-colors tabular-nums">
                  4,7 / 5 (108 değerlendirme)
                </a>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-[52px] font-medium tracking-tight text-stone-900 leading-[1.12]">
                İşletmeniz için tek bağlantıdan 7/24 online randevu ve takvim yönetimi
              </h1>

              <p className="mt-5 text-base sm:text-lg text-stone-600 max-w-2xl leading-relaxed font-normal">
                Telefon trafiğini ve çakışan saatleri ortadan kaldırın. Müşterileriniz QR kod veya size özel bağlantı üzerinden randevu alsın; siz takvimi, WhatsApp onaylarını ve günlük ciroyu tek ekrandan takip edin.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-3">
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto px-6 py-3 rounded-lg bg-blue-700 text-white font-medium text-sm hover:bg-blue-800 transition-colors inline-flex items-center justify-center gap-2"
                >
                  İşletme tablosunu incele
                  <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </Link>
                <Link
                  href="/nasil-kullanilir"
                  className="w-full sm:w-auto px-6 py-3 rounded-lg bg-white text-stone-900 border border-stone-900/15 font-medium text-sm hover:border-stone-400 transition-colors inline-flex items-center justify-center gap-2"
                >
                  Nasıl kullanılır
                </Link>
              </div>
            </div>

            {/* Real Product Preview */}
            <HeroShowcaseMockup />
          </div>
        </section>

        {/* Step-by-Step How It Works */}
        <section id="nasil-calisir" className="scroll-mt-28 py-20 bg-white border-b border-stone-900/10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-12 text-left">
              <div className="text-xs font-mono text-stone-500 mb-2">Sistem akışı</div>
              <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-stone-900">
                Dört adımda düzenli randevu akışı
              </h2>
              <p className="mt-3 text-sm sm:text-base text-stone-600 leading-relaxed">
                Hem işletmeniz hem de müşterileriniz için ek uygulama gerektirmeyen sade kurulum.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  step: '01',
                  title: 'İşletmenizi tanımlayın',
                  desc: 'Hizmetlerinizi, seans sürelerinizi ve personel çalışma saatlerinizi birkaç dakikada girin.',
                },
                {
                  step: '02',
                  title: 'Bağlantı veya QR paylaşın',
                  desc: 'Size özel randevory.com/isletmeniz bağlantısını profilinize ekleyin veya vitrin QR afişini asın.',
                },
                {
                  step: '03',
                  title: 'Müşteriniz saat seçsin',
                  desc: 'Müşterileriniz üye olmadan hizmet, uzman ve müsait saati seçerek randevusunu oluştursun.',
                },
                {
                  step: '04',
                  title: 'Takvim ve ciroyu yönetin',
                  desc: 'Gelen randevuları tek tıkla onaylayın, WhatsApp mesajı gönderin ve günlük kazancınızı görün.',
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="p-6 rounded-xl border border-stone-900/10 bg-[#fafaf8] flex flex-col justify-between"
                >
                  <div>
                    <div className="text-xs font-mono tabular-nums text-stone-400 mb-4">{item.step}</div>
                    <h3 className="font-medium text-stone-900 text-base">{item.title}</h3>
                    <p className="text-sm text-stone-600 mt-2 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <Link
                href="/nasil-kullanilir"
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800 transition-colors"
              >
                Adım adım müşteri ve işletme rehberini aç
                <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        </section>

        {/* Sectors Live Simulator */}
        <section id="sectors" className="scroll-mt-28 py-20 bg-[#f5f4ef] border-b border-stone-900/10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-12 text-left">
              <div className="text-xs font-mono text-stone-500 mb-2">Sektöre göre önizleme</div>
              <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-stone-900">
                Randevulu çalışan tüm işletmelere uygun
              </h2>
              <p className="mt-3 text-sm sm:text-base text-stone-600 leading-relaxed">
                Kendi sektörünüzü seçerek müşterilerinizin göreceği randevu sayfasını anında inceleyin.
              </p>
            </div>

            <SectorLiveSimulator />
          </div>
        </section>

        {/* Features Asymmetric Grid */}
        <section id="features" className="scroll-mt-28 py-20 bg-white border-b border-stone-900/10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-12 text-left">
              <div className="text-xs font-mono text-stone-500 mb-2">Temel yetenekler</div>
              <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-stone-900">
                Günlük operasyonu sadeleştiren araçlar
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Wide Lead Feature */}
              <div className="md:col-span-2 p-6 rounded-xl border border-stone-900/10 bg-[#fafaf8] flex flex-col justify-between gap-6">
                <div>
                  <Calendar className="w-4 h-4 text-stone-500 mb-4" strokeWidth={1.5} />
                  <h3 className="text-lg font-medium text-stone-900 mb-2">Akıllı randevu takvimi</h3>
                  <p className="text-stone-600 leading-relaxed text-sm max-w-xl">
                    Günlük, haftalık ve personel bazlı görünümler. Gelen randevuları tek tıkla onaylayın, işlem tamamlandığında ciroya otomatik yansıtın veya WhatsApp mesajı gönderin.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="rounded-lg bg-white border border-stone-900/10 p-3">
                    <div className="text-xs font-medium text-stone-900">Günlük görünüm</div>
                    <div className="text-[11px] text-stone-500 mt-0.5">Saatlik akış</div>
                  </div>
                  <div className="rounded-lg bg-white border border-stone-900/10 p-3">
                    <div className="text-xs font-medium text-stone-900">Personel planı</div>
                    <div className="text-[11px] text-stone-500 mt-0.5">Ekip bazlı sütunlar</div>
                  </div>
                  <div className="rounded-lg bg-white border border-stone-900/10 p-3">
                    <div className="text-xs font-medium text-blue-700">Tek tık onay</div>
                    <div className="text-[11px] text-stone-500 mt-0.5">Tamamlandığında ciro</div>
                  </div>
                </div>
              </div>

              {/* Conflict Lock Card */}
              <div className="p-6 rounded-xl border border-stone-900/10 bg-stone-900 text-white flex flex-col justify-between">
                <div>
                  <ShieldCheck className="w-4 h-4 text-stone-400 mb-4" strokeWidth={1.5} />
                  <h3 className="text-lg font-medium mb-2">Çakışma önleme motoru</h3>
                  <p className="text-stone-300 leading-relaxed text-sm">
                    Aynı personele aynı saat diliminde iki randevu verilmesini hem veritabanı GIST kısıtlarıyla hem de slot algoritmasıyla engeller.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono text-stone-300">
                  <span>Veritabanı kilidi</span>
                  <span>Aktif</span>
                </div>
              </div>

              {/* Remaining Features */}
              <div className="p-6 rounded-xl border border-stone-900/10 bg-[#fafaf8] flex flex-col justify-between gap-4">
                <div>
                  <QrCode className="w-4 h-4 text-stone-500 mb-4" strokeWidth={1.5} />
                  <h3 className="text-base font-medium text-stone-900 mb-2">QR kod ve vitrin afişi</h3>
                  <p className="text-stone-600 leading-relaxed text-sm">
                    İşletmenize özel yüksek çözünürlüklü QR kod ve baskıya hazır A4 vitrin afişini tek tıkla indirin.
                  </p>
                </div>
                <div className="text-xs font-mono text-stone-500">randevory.com/isletmeniz</div>
              </div>

              <div className="p-6 rounded-xl border border-stone-900/10 bg-[#fafaf8] flex flex-col justify-between gap-4">
                <div>
                  <MessageSquare className="w-4 h-4 text-stone-500 mb-4" strokeWidth={1.5} />
                  <h3 className="text-base font-medium text-stone-900 mb-2">Canlı sohbet ve WhatsApp</h3>
                  <p className="text-stone-600 leading-relaxed text-sm">
                    Müşterileriniz randevu sayfasından size anlık mesaj yazsın; randevu sonrası hazır WhatsApp şablonuyla onay gönderin.
                  </p>
                </div>
                <div className="text-xs font-mono text-stone-500">Hazır onay şablonu</div>
              </div>

              <div className="p-6 rounded-xl border border-stone-900/10 bg-[#fafaf8] flex flex-col justify-between gap-4">
                <div>
                  <TrendingUp className="w-4 h-4 text-stone-500 mb-4" strokeWidth={1.5} />
                  <h3 className="text-base font-medium text-stone-900 mb-2">Finans ve ciro raporları</h3>
                  <p className="text-stone-600 leading-relaxed text-sm">
                    Tamamlanan randevulardan oluşan günlük ve aylık kazançlarınızı, en çok tercih edilen hizmetleri takip edin.
                  </p>
                </div>
                <div className="text-xs font-mono text-stone-500">Personel ve hizmet bazlı</div>
              </div>
            </div>

            {/* Bottom Strip */}
            <div className="mt-4 p-6 rounded-xl border border-stone-900/10 bg-[#fafaf8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-4">
                <Clock className="w-4 h-4 text-stone-500 shrink-0 mt-1 sm:mt-0" strokeWidth={1.5} />
                <div>
                  <h3 className="text-base font-medium text-stone-900">Müşteri sorgulama ve CRM</h3>
                  <p className="text-stone-600 text-sm mt-0.5">
                    Müşteriler telefon numarasıyla kendi randevusunu sorgulayıp iptal edebilir; ziyaret ve harcama geçmişi otomatik kaydedilir.
                  </p>
                </div>
              </div>
              <Link
                href="/register"
                className="shrink-0 px-4 py-2.5 rounded-lg bg-white border border-stone-900/15 text-stone-900 text-xs font-medium hover:border-stone-400 transition-colors text-center"
              >
                Hesap oluştur
              </Link>
            </div>
          </div>
        </section>

        {/* Quiet CTA Band */}
        <section className="py-16 bg-stone-900 text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="text-xs font-mono text-stone-400">Hızlı başlangıç</div>
              <h2 className="text-2xl sm:text-3xl font-medium tracking-tight">
                İşletmenizi bugün çevrimiçi randevuya açın
              </h2>
              <p className="text-sm text-stone-300 leading-relaxed">
                Ücretsiz Başlangıç paketi ile hemen hesabınızı açın; kredi kartı gerekmez, taahhüt ve gizli ücret yoktur.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <Link
                href="/register"
                className="w-full sm:w-auto px-6 py-3 rounded-lg bg-white text-stone-900 font-medium text-sm hover:bg-stone-100 transition-colors inline-flex items-center justify-center gap-2"
              >
                Ücretsiz hesap oluştur
                <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </Link>
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-6 py-3 rounded-lg bg-transparent text-white border border-white/20 font-medium text-sm hover:border-white/40 transition-colors text-center"
              >
                Paneli gör
              </Link>
            </div>
          </div>
        </section>

        {/* Customer & Business Rating + 108 Reviews Section */}
        <ReviewsSection />

        {/* Subscription Plans Interactive Section with Monthly/Yearly Toggle */}
        <PricingSection />

        {/* Footer */}
        <footer className="bg-stone-900 text-stone-400 py-12 mt-auto border-t border-white/10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <BrandLogo size="md" variant="dark" showSlogan={true} />
              <p className="text-xs text-stone-500 text-center md:text-left">
                &copy; {new Date().getFullYear()} RANDEVORY. Tüm hakları saklıdır. Profesyonel Randevu ve Hizmet Yönetim Platformu.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
                <Link href="/nasil-kullanilir" className="hover:text-white transition-colors">Nasıl Kullanılır</Link>
                <a href="#yorumlar" className="hover:text-white transition-colors">Kullanıcı Yorumları</a>
                <Link href="/yasal#on-bilgilendirme" className="hover:text-white transition-colors">Ön Bilgilendirme</Link>
                <Link href="/yasal#hizmet-sozlesmesi" className="hover:text-white transition-colors">Hizmet Sözleşmesi</Link>
                <Link href="/yasal#iptal-iade" className="hover:text-white transition-colors">İptal &amp; İade</Link>
                <Link href="/yasal#cerez" className="hover:text-white transition-colors">Çerez Politikası</Link>
                <Link href="/yasal#kvkk" className="hover:text-white transition-colors">Gizlilik &amp; KVKK</Link>
                <Link href="/yasal#veri-silme" className="hover:text-white transition-colors">Veri Silme Talebi</Link>
                <Link href="/dashboard" className="hover:text-white transition-colors">İşletme Tablosu</Link>
              </div>
            </div>
            <div className="pt-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-stone-500">
              <span>256-Bit SSL &amp; Shopier 3D Secure Korumalı Ödeme Altyapısı · Gizli Ücret Yok, Taahhüt Yok</span>
              <span>Resmi İletişim: destek@randevory.com · kvkk@randevory.com</span>
            </div>
          </div>
        </footer>
      </div>
    </SmoothScrollProvider>
  );
}
