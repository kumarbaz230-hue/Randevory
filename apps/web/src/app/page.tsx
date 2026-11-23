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
  Check,
  Clock,
  MessageSquare,
  QrCode,
  ShieldCheck,
  Star,
  TrendingUp,
} from 'lucide-react';

export default function HomePage() {
  return (
    <SmoothScrollProvider>
      <div className="flex flex-col min-h-screen bg-[#FBF8F3] text-[#171310]">
        {/* Top Navbar & Mobile Quick Nav */}
        <HomeHeader />

        {/* Rich Warm Editorial Hero */}
        <section className="pt-10 pb-16 sm:pt-14 sm:pb-20 lg:pt-20 lg:pb-24 bg-[#FBF8F3] border-b border-[#171310]/10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              {/* Left Column: Editorial Headline + Actions */}
              <div className="lg:col-span-7 text-left">
                <a
                  href="#yorumlar"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F3EDE2] border border-[#171310]/10 text-xs font-medium text-[#575049] hover:border-[#B84A24]/40 transition-colors mb-6"
                >
                  <Star className="w-3.5 h-3.5 fill-[#C2592B] text-[#C2592B]" />
                  <span className="font-mono tabular-nums font-semibold text-[#171310]">4,7 / 5</span>
                  <span>·</span>
                  <span>108 gerçek işletme değerlendirmesi</span>
                </a>

                <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-semibold tracking-tight text-[#171310] leading-[1.1]">
                  İşletmeniz için{' '}
                  <span className="font-serif italic font-normal text-[#B84A24]">
                    zamanı geri kazandıran
                  </span>{' '}
                  online randevu düzeni
                </h1>

                <p className="mt-5 text-base sm:text-lg text-[#575049] max-w-xl leading-relaxed">
                  Telefon trafiğine ve çakışan saatlere son verin. Müşterileriniz QR kod veya size özel bağlantı üzerinden 30 saniyede randevu alsın; siz takvimi, WhatsApp onaylarını ve günlük cironuzu tek ekrandan yönetin.
                </p>

                <div className="mt-7 flex flex-col sm:flex-row sm:items-center gap-3">
                  <Link
                    href="/register"
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#171310] text-[#FBF8F3] font-semibold text-sm hover:bg-[#2C2520] transition-colors inline-flex items-center justify-center gap-2"
                  >
                    Ücretsiz hesap oluştur
                    <ArrowRight className="w-4 h-4" strokeWidth={1.6} />
                  </Link>
                  <Link
                    href="/dashboard"
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white text-[#171310] border border-[#171310]/15 font-semibold text-sm hover:border-[#B84A24] transition-colors inline-flex items-center justify-center gap-2"
                  >
                    İşletme tablosunu incele
                  </Link>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#6E655C]">
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#15803D]" strokeWidth={2} />
                    Kurulum 2 dakika
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#15803D]" strokeWidth={2} />
                    Üyeliksiz müşteri randevusu
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#15803D]" strokeWidth={2} />
                    Taahhüt ve gizli ücret yok
                  </span>
                </div>
              </div>

              {/* Right Column: Warm Espresso Live Studio Card */}
              <div className="lg:col-span-5">
                <div className="rounded-2xl bg-[#171310] text-[#FBF8F3] p-5 sm:p-6 shadow-[0_24px_60px_-20px_rgba(23,19,16,0.32)] border border-[#171310]">
                  <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <div>
                      <div className="text-[11px] font-mono text-[#C8BEB2]">Bugünkü canlı akış</div>
                      <div className="text-base font-semibold mt-0.5">Studio Demir · Merkez</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-[#B84A24] text-white text-[11px] font-mono tabular-nums font-semibold">
                      %92 dolu
                    </span>
                  </div>

                  <div className="py-4 space-y-2.5">
                    {[
                      { time: '14:30', client: 'Caner Yılmaz', service: 'Saç & Bakım', state: 'Onaylandı' },
                      { time: '15:15', client: 'Mert Arslan', service: 'Sakal Tasarımı', state: 'QR ile alındı' },
                      { time: '16:00', client: 'Burak Demirci', service: 'Cilt Bakımı', state: 'WhatsApp iletildi' },
                    ].map((row, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 p-3 rounded-xl bg-white/[0.06] border border-white/10"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="px-2 py-1 rounded-md bg-[#FBF8F3] text-[#171310] font-mono tabular-nums text-xs font-semibold shrink-0">
                            {row.time}
                          </span>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-white truncate">{row.client}</div>
                            <div className="text-[11px] text-[#C8BEB2] truncate">{row.service}</div>
                          </div>
                        </div>
                        <span className="text-[11px] text-[#E6A488] font-medium shrink-0">{row.state}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="text-[#C8BEB2]">Çakışma kilidi</span>
                    <span className="font-mono text-white font-semibold">GIST Lock · Aktif</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive 3-Tab Product Showcase */}
            <HeroShowcaseMockup />
          </div>
        </section>

        {/* Step-by-Step How It Works */}
        <section id="nasil-calisir" className="scroll-mt-28 py-20 bg-white border-b border-[#171310]/10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-12 text-left">
              <div className="text-xs font-mono text-[#B84A24] font-semibold mb-2">Sistem akışı</div>
              <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight text-[#171310]">
                Dört adımda{' '}
                <span className="font-serif italic font-normal text-[#B84A24]">düzenli</span>{' '}
                randevu akışı
              </h2>
              <p className="mt-3 text-sm sm:text-base text-[#575049] leading-relaxed">
                Hem işletmeniz hem de müşterileriniz için ek uygulama indirme zorunluluğu olmayan sade kurulum.
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
                  className="p-6 rounded-2xl border border-[#171310]/10 bg-[#FBF8F3] flex flex-col justify-between"
                >
                  <div>
                    <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#171310] text-[#FBF8F3] text-xs font-mono tabular-nums font-semibold mb-5">
                      {item.step}
                    </div>
                    <h3 className="font-semibold text-[#171310] text-base">{item.title}</h3>
                    <p className="text-sm text-[#575049] mt-2 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <Link
                href="/nasil-kullanilir"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#B84A24] hover:text-[#9E3D1C] transition-colors"
              >
                Adım adım müşteri ve işletme rehberini aç
                <ArrowRight className="w-4 h-4" strokeWidth={1.6} />
              </Link>
            </div>
          </div>
        </section>

        {/* Warm Espresso Contrasting Section: Live Sector Simulator */}
        <section id="sectors" className="scroll-mt-28 py-20 bg-[#171310] text-[#FBF8F3]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-12 text-left">
              <div className="text-xs font-mono text-[#E6A488] mb-2">Sektöre göre önizleme</div>
              <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight text-white">
                Randevulu çalışan{' '}
                <span className="font-serif italic font-normal text-[#E6A488]">tüm işletmelere</span>{' '}
                uygun
              </h2>
              <p className="mt-3 text-sm sm:text-base text-[#C8BEB2] leading-relaxed">
                Kendi sektörünüzü seçerek müşterilerinizin göreceği randevu sayfasını anında inceleyin.
              </p>
            </div>

            <SectorLiveSimulator />
          </div>
        </section>

        {/* Warm Features Bento Grid */}
        <section id="features" className="scroll-mt-28 py-20 bg-[#FBF8F3] border-b border-[#171310]/10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-12 text-left">
              <div className="text-xs font-mono text-[#B84A24] font-semibold mb-2">Temel yetenekler</div>
              <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight text-[#171310]">
                Günlük operasyonu sadeleştiren araçlar
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Wide Lead Feature */}
              <div className="md:col-span-2 p-6 sm:p-7 rounded-2xl border border-[#171310]/10 bg-white flex flex-col justify-between gap-6">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#FDF4EF] border border-[#B84A24]/20 text-[#B84A24] flex items-center justify-center mb-4">
                    <Calendar className="w-5 h-5" strokeWidth={1.6} />
                  </div>
                  <h3 className="text-lg font-semibold text-[#171310] mb-2">Akıllı randevu takvimi</h3>
                  <p className="text-[#575049] leading-relaxed text-sm max-w-xl">
                    Günlük, haftalık ve personel bazlı görünümler. Gelen randevuları tek tıkla onaylayın, işlem tamamlandığında ciroya otomatik yansıtın veya WhatsApp mesajı gönderin.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="rounded-xl bg-[#FBF8F3] border border-[#171310]/10 p-3">
                    <div className="text-xs font-semibold text-[#171310]">Günlük görünüm</div>
                    <div className="text-[11px] text-[#6E655C] mt-0.5">Saatlik akış</div>
                  </div>
                  <div className="rounded-xl bg-[#FBF8F3] border border-[#171310]/10 p-3">
                    <div className="text-xs font-semibold text-[#171310]">Personel planı</div>
                    <div className="text-[11px] text-[#6E655C] mt-0.5">Ekip bazlı sütunlar</div>
                  </div>
                  <div className="rounded-xl bg-[#FDF4EF] border border-[#B84A24]/20 p-3">
                    <div className="text-xs font-semibold text-[#B84A24]">Tek tık onay</div>
                    <div className="text-[11px] text-[#6E655C] mt-0.5">Tamamlandığında ciro</div>
                  </div>
                </div>
              </div>

              {/* Conflict Lock Card */}
              <div className="p-6 sm:p-7 rounded-2xl border border-[#171310] bg-[#171310] text-[#FBF8F3] flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-white/10 text-[#E6A488] flex items-center justify-center mb-4">
                    <ShieldCheck className="w-5 h-5" strokeWidth={1.6} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Çakışma önleme motoru</h3>
                  <p className="text-[#C8BEB2] leading-relaxed text-sm">
                    Aynı personele aynı saat diliminde iki randevu verilmesini hem veritabanı GIST kısıtlarıyla hem de slot algoritmasıyla engeller.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono text-[#E6A488]">
                  <span>Veritabanı kilidi</span>
                  <span>%100 Aktif</span>
                </div>
              </div>

              {/* Remaining Features */}
              <div className="p-6 rounded-2xl border border-[#171310]/10 bg-white flex flex-col justify-between gap-4">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#F3EDE2] text-[#171310] flex items-center justify-center mb-4">
                    <QrCode className="w-5 h-5" strokeWidth={1.6} />
                  </div>
                  <h3 className="text-base font-semibold text-[#171310] mb-2">QR kod ve vitrin afişi</h3>
                  <p className="text-[#575049] leading-relaxed text-sm">
                    İşletmenize özel yüksek çözünürlüklü QR kod ve baskıya hazır A4 vitrin afişini tek tıkla indirin.
                  </p>
                </div>
                <div className="text-xs font-mono text-[#6E655C]">randevory.com/isletmeniz</div>
              </div>

              <div className="p-6 rounded-2xl border border-[#171310]/10 bg-white flex flex-col justify-between gap-4">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#F3EDE2] text-[#171310] flex items-center justify-center mb-4">
                    <MessageSquare className="w-5 h-5" strokeWidth={1.6} />
                  </div>
                  <h3 className="text-base font-semibold text-[#171310] mb-2">Canlı sohbet ve WhatsApp</h3>
                  <p className="text-[#575049] leading-relaxed text-sm">
                    Müşterileriniz randevu sayfasından size anlık mesaj yazsın; randevu sonrası hazır WhatsApp şablonuyla onay gönderin.
                  </p>
                </div>
                <div className="text-xs font-mono text-[#15803D]">Hazır onay şablonu</div>
              </div>

              <div className="p-6 rounded-2xl border border-[#171310]/10 bg-white flex flex-col justify-between gap-4">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#F3EDE2] text-[#171310] flex items-center justify-center mb-4">
                    <TrendingUp className="w-5 h-5" strokeWidth={1.6} />
                  </div>
                  <h3 className="text-base font-semibold text-[#171310] mb-2">Finans ve ciro raporları</h3>
                  <p className="text-[#575049] leading-relaxed text-sm">
                    Tamamlanan randevulardan oluşan günlük ve aylık kazançlarınızı, en çok tercih edilen hizmetleri takip edin.
                  </p>
                </div>
                <div className="rounded-xl bg-[#FBF8F3] border border-[#171310]/10 p-2.5 flex items-end gap-1.5 h-11">
                  {[35, 50, 44, 68, 84, 100, 72].map((h, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-t-sm ${i === 5 ? 'bg-[#B84A24]' : 'bg-[#D9CFC0]'}`}
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Strip */}
            <div className="mt-4 p-6 rounded-2xl border border-[#171310]/10 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#F3EDE2] text-[#171310] flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" strokeWidth={1.6} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#171310]">Müşteri sorgulama ve CRM</h3>
                  <p className="text-[#575049] text-sm mt-0.5">
                    Müşteriler telefon numarasıyla kendi randevusunu sorgulayıp iptal edebilir; ziyaret ve harcama geçmişi otomatik kaydedilir.
                  </p>
                </div>
              </div>
              <Link
                href="/register"
                className="shrink-0 px-5 py-2.5 rounded-xl bg-[#171310] text-[#FBF8F3] text-xs font-semibold hover:bg-[#2C2520] transition-colors text-center"
              >
                Hesap oluştur
              </Link>
            </div>
          </div>
        </section>

        {/* Warm Terracotta-Accented CTA Band */}
        <section className="py-16 bg-[#171310] text-[#FBF8F3]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="text-xs font-mono text-[#E6A488]">Hızlı başlangıç</div>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                İşletmenizi bugün çevrimiçi randevuya açın
              </h2>
              <p className="text-sm text-[#C8BEB2] leading-relaxed">
                Ücretsiz Başlangıç paketi ile hemen hesabınızı açın; kredi kartı gerekmez, taahhüt ve gizli ücret yoktur.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <Link
                href="/register"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#B84A24] text-white font-semibold text-sm hover:bg-[#9E3D1C] transition-colors inline-flex items-center justify-center gap-2"
              >
                Ücretsiz hesap oluştur
                <ArrowRight className="w-4 h-4" strokeWidth={1.6} />
              </Link>
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-transparent text-[#FBF8F3] border border-white/20 font-semibold text-sm hover:border-white/40 transition-colors text-center"
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
        <footer className="bg-[#171310] text-[#A89E92] py-12 mt-auto border-t border-white/10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <BrandLogo size="md" variant="dark" showSlogan={true} />
              <p className="text-xs text-[#8A8076] text-center md:text-left">
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
            <div className="pt-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#8A8076]">
              <span>256-Bit SSL &amp; Shopier 3D Secure Korumalı Ödeme Altyapısı · Gizli Ücret Yok, Taahhüt Yok</span>
              <span>Resmi İletişim: destek@randevory.com · kvkk@randevory.com</span>
            </div>
          </div>
        </footer>
      </div>
    </SmoothScrollProvider>
  );
}
