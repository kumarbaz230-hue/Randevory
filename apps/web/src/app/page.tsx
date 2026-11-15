import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';
import { HomeHeader } from '@/components/home-header';
import { ReviewsSection } from '@/components/reviews-section';
import { PricingSection } from '@/components/pricing-section';
import { SmoothScrollProvider } from '@/components/smooth-scroll-provider';
import { HomeAnimations } from '@/components/home-animations';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { HeroShowcaseMockup } from '@/components/hero-showcase-mockup';
import { HeroAmbientCanvas } from '@/components/hero-ambient-canvas';
import {
  Calendar,
  Clock,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Scissors,
  Wrench,
  GraduationCap,
  HeartPulse,
  Laptop,
  BookOpen,
  Star,
  QrCode,
  MessageSquare,
  UtensilsCrossed,
  CheckCircle2,
  Lock,
  Zap,
} from 'lucide-react';

export default function HomePage() {
  const sectors = [
    { name: 'Kuaför & Berberler', icon: Scissors, desc: 'Saç, sakal ve bakım' },
    { name: 'Kafe & Restoranlar', icon: UtensilsCrossed, desc: 'Masa ve loca rezervasyonu' },
    { name: 'Oto Bakım & Detailing', icon: Wrench, desc: 'Periyodik bakım ve yıkama' },
    { name: 'Özel Ders & Eğitim', icon: GraduationCap, desc: 'Birebir ders ve seans' },
    { name: 'Veteriner Klinikleri', icon: HeartPulse, desc: 'Muayene ve aşı takvimi' },
    { name: 'Teknik Servisler', icon: Laptop, desc: 'Cihaz onarım ve teslim' },
  ];

  return (
    <SmoothScrollProvider>
      <HomeAnimations>
        <div className="flex flex-col min-h-screen bg-white">
          {/* Top Navbar & Mobile Quick Nav */}
          <HomeHeader />

          {/* Hero Section */}
          <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28 bg-gradient-to-b from-slate-50 via-white to-slate-50/70">
            {/* Subtle Ambient Grid & Glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_65%,transparent_100%)] opacity-45"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[560px] h-[300px] rounded-full bg-brand-500/15 blur-3xl"
            />
            <HeroAmbientCanvas />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
              <div className="gsap-hero-item inline-flex flex-wrap items-center justify-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur border border-slate-200/90 text-slate-700 text-xs font-semibold mb-7 shadow-sm">
                <span className="inline-flex items-center gap-1.5 text-brand-700">
                  <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                  Yeni Nesil Randevu Altyapısı
                </span>
                <span className="text-slate-300">•</span>
                <a href="#yorumlar" className="inline-flex items-center gap-1 text-amber-700 hover:underline font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  4.7/5 (108+ Yorum)
                </a>
              </div>

              <h1 className="gsap-hero-item text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.12]">
                İşletmeniz İçin{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-blue-600 to-indigo-600">
                  Kusursuz
                </span>{' '}
                Randevu ve Personel Yönetimi
              </h1>

              <p className="gsap-hero-item mt-5 text-base sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
                Telefon trafiğine ve randevu çakışmalarına son verin. Müşterileriniz QR kod veya link ile 7/24 randevu alsın; WhatsApp, canlı sohbet ve ciro takibini tek ekrandan yönetin.
              </p>

              <div className="gsap-hero-item mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-brand-600 text-white font-bold text-sm shadow-lg shadow-brand-600/25 hover:bg-brand-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                  İşletme Tablosunu İncele <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/nasil-kullanilir"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white text-slate-800 border border-slate-300 font-semibold text-sm hover:bg-slate-50 hover:border-slate-400 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <BookOpen className="w-4 h-4 text-brand-600" />
                  Nasıl Kullanılır?
                </Link>
              </div>

              {/* Trust Mini Pills */}
              <div className="gsap-hero-item mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-500 font-medium">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Ücretsiz Başlangıç Paketi
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Kurulum 2 Dakika
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-brand-600" />
                  Taahhüt &amp; Gizli Ücret Yok
                </span>
              </div>

              {/* Interactive Product Showcase */}
              <HeroShowcaseMockup />

              {/* Quick Stats Badges */}
              <div className="gsap-hero-item mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
                <div className="bg-white/90 backdrop-blur rounded-2xl p-4 border border-slate-200/80 shadow-sm">
                  <div className="text-xl sm:text-2xl font-extrabold text-slate-900">%0</div>
                  <div className="text-[11px] sm:text-xs text-slate-500 mt-1 font-medium">Çakışma Garantisi (GIST Lock)</div>
                </div>
                <div className="bg-white/90 backdrop-blur rounded-2xl p-4 border border-slate-200/80 shadow-sm">
                  <div className="text-xl sm:text-2xl font-extrabold text-slate-900">7/24</div>
                  <div className="text-[11px] sm:text-xs text-slate-500 mt-1 font-medium">Kesintisiz Randevu Alma</div>
                </div>
                <div className="bg-white/90 backdrop-blur rounded-2xl p-4 border border-slate-200/80 shadow-sm">
                  <div className="text-xl sm:text-2xl font-extrabold text-slate-900">&lt; 30 sn</div>
                  <div className="text-[11px] sm:text-xs text-slate-500 mt-1 font-medium">Müşteri Randevu Tamamlama</div>
                </div>
                <div className="bg-white/90 backdrop-blur rounded-2xl p-4 border border-slate-200/80 shadow-sm">
                  <div className="text-xl sm:text-2xl font-extrabold text-amber-500 flex items-center justify-center gap-1">
                    4.7 <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-400 text-amber-400" />
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-500 mt-1 font-medium">1.840+ Beğeni &amp; Memnuniyet</div>
                </div>
              </div>
            </div>
          </section>

          {/* Step-by-Step How It Works Section */}
          <section id="nasil-calisir" className="scroll-mt-28 py-20 bg-white border-t border-slate-200/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-14">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 font-bold text-[11px] uppercase tracking-wider">
                  <Zap className="w-3.5 h-3.5" />
                  Adım Adım Sistem Rehberi
                </span>
                <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mt-3">
                  RANDEVORY Nasıl Kullanılır?
                </h2>
                <p className="mt-3 text-slate-600 text-sm sm:text-base">
                  Hem işletmeniz hem de müşterileriniz için 4 basit adımda kusursuz randevu yönetimi.
                </p>
              </div>

              <div className="gsap-reveal-group grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  {
                    step: '01',
                    title: 'İşletmenizi Tanımlayın',
                    desc: 'Kayıt olun, hizmetlerinizi, seans sürelerinizi ve personellerinizin çalışma saatlerini birkaç dakikada girin.',
                  },
                  {
                    step: '02',
                    title: 'Link veya QR Kod Paylaşın',
                    desc: 'Size özel randevory.com/isletmeniz linkini Instagram profilinize ekleyin veya hazır Vitrin QR Afişini camınıza asın.',
                  },
                  {
                    step: '03',
                    title: 'Müşteriniz Saatini Seçsin',
                    desc: 'Müşterileriniz uygulama indirmeden veya üye olmadan; hizmet, uzman ve müsait saati seçerek 30 saniyede randevu alsın.',
                  },
                  {
                    step: '04',
                    title: 'WhatsApp & Takvim Yönetimi',
                    desc: 'Tüm randevuları akıllı takvimde görün, tek tıkla WhatsApp onayı gönderin, canlı sohbet ve aylık cironuzu takip edin.',
                  },
                ].map((item) => (
                  <SpotlightCard
                    key={item.step}
                    className="gsap-reveal-card p-6 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-5">
                        <span className="w-10 h-10 rounded-xl bg-brand-600 text-white font-extrabold text-sm flex items-center justify-center shadow-sm shadow-brand-600/20">
                          {item.step}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Adım {item.step}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-base">{item.title}</h3>
                      <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">{item.desc}</p>
                    </div>
                  </SpotlightCard>
                ))}
              </div>

              <div className="mt-10 text-center">
                <Link
                  href="/nasil-kullanilir"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900 text-white font-semibold text-xs sm:text-sm hover:bg-slate-800 transition-all shadow-sm"
                >
                  İnteraktif Müşteri &amp; İşletme Rehberini Aç <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </section>

          {/* Sectors Interactive Showcase */}
          <section id="sectors" className="scroll-mt-28 py-20 bg-slate-50 border-y border-slate-200/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-12">
                <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                  Tek Bir Sektöre Değil, Randevulu Tüm İşletmelere Özel
                </h2>
                <p className="mt-3 text-slate-600 text-sm sm:text-base">
                  Her sektörün dinamikleri farklıdır. Seans sürelerinizi, mola aralıklarınızı ve personel yetkinliklerinizi ihtiyacınıza göre özelleştirin.
                </p>
              </div>

              <div className="gsap-reveal-group grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {sectors.map((sector, idx) => {
                  const Icon = sector.icon;
                  return (
                    <Link
                      key={idx}
                      href="/nasil-kullanilir"
                      className="gsap-reveal-card group p-5 rounded-2xl border border-slate-200 bg-white hover:border-brand-500 hover:shadow-lg hover:shadow-brand-500/10 hover:-translate-y-0.5 transition-all flex flex-col items-center text-center"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 group-hover:bg-brand-50 group-hover:border-brand-300 flex items-center justify-center text-slate-700 group-hover:text-brand-600 transition-colors shadow-sm mb-3.5">
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 group-hover:text-brand-600 transition-colors leading-snug">
                        {sector.name}
                      </h3>
                      <span className="text-[11px] text-slate-500 mt-1.5 leading-tight">
                        {sector.desc} &rarr;
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Key Features Bento Grid */}
          <section id="features" className="scroll-mt-28 py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-14">
                <span className="text-brand-600 font-bold text-xs uppercase tracking-wider">İşletmenizi Büyütün</span>
                <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mt-2">
                  Profesyonel Yönetim İçin Gereken Her Şey
                </h2>
              </div>

              <div className="gsap-reveal-group grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Featured Wide Bento Card */}
                <SpotlightCard className="gsap-reveal-card md:col-span-2 bg-gradient-to-br from-slate-50 to-blue-50/40 p-7 sm:p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center mb-5 shadow-md shadow-brand-600/20">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-extrabold text-slate-900 mb-2">Akıllı Randevu Takvimi</h3>
                      <p className="text-slate-600 leading-relaxed text-sm max-w-xl">
                        Günlük, haftalık ve personel bazlı görünümler. Gelen randevuları tek tıkla onaylayın, işlem tamamlandığında ciroya otomatik yansıtın veya WhatsApp mesajı gönderin.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2.5 pt-2">
                    <div className="rounded-xl bg-white border border-slate-200/80 p-3 text-center">
                      <div className="text-xs font-bold text-slate-900">Günlük</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Saatlik Akış</div>
                    </div>
                    <div className="rounded-xl bg-white border border-slate-200/80 p-3 text-center">
                      <div className="text-xs font-bold text-slate-900">Personel</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Ekip Bazlı</div>
                    </div>
                    <div className="rounded-xl bg-white border border-slate-200/80 p-3 text-center">
                      <div className="text-xs font-bold text-emerald-700">Tek Tık</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Onay &amp; Tamamla</div>
                    </div>
                  </div>
                </SpotlightCard>

                {/* Highlighted Security Card */}
                <SpotlightCard
                  spotlightColor="rgba(16, 185, 129, 0.14)"
                  className="gsap-reveal-card bg-slate-900 text-white p-7 sm:p-8 rounded-3xl border border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-5">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-extrabold mb-2">Çakışma Önleme Motoru</h3>
                    <p className="text-slate-300 leading-relaxed text-sm">
                      Aynı personele aynı saat diliminde iki randevu verilmesini hem veritabanı kısıtlarıyla (GIST Lock) hem de algoritmayla kesinlikle engeller.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-emerald-300 font-semibold">
                    <span>Veritabanı Seviyesinde Koruma</span>
                    <span>%100 Aktif</span>
                  </div>
                </SpotlightCard>

                {/* Remaining 4 Standard Bento Cards */}
                <SpotlightCard
                  spotlightColor="rgba(147, 51, 234, 0.12)"
                  className="gsap-reveal-card bg-slate-50/70 p-7 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-5"
                >
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-5">
                      <QrCode className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-900 mb-2">QR Kod &amp; Vitrin Afişi</h3>
                    <p className="text-slate-600 leading-relaxed text-sm">
                      İşletmenize özel yüksek çözünürlüklü QR kod ve baskıya hazır vitrin afişini tek tıkla indirin; müşterileriniz kamerayla okutup randevu alsın.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white border border-slate-200/80 p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-slate-900 truncate">randevory.com/isletmeniz</div>
                      <div className="text-[10px] text-purple-600 font-semibold">A4 Baskıya Hazır PDF / PNG</div>
                    </div>
                  </div>
                </SpotlightCard>

                <SpotlightCard
                  spotlightColor="rgba(245, 158, 11, 0.12)"
                  className="gsap-reveal-card bg-slate-50/70 p-7 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-5"
                >
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-900 mb-2">Canlı Sohbet &amp; WhatsApp</h3>
                    <p className="text-slate-600 leading-relaxed text-sm">
                      Müşterileriniz randevu sayfasından size anlık mesaj yazsın, randevu sonrası hazır WhatsApp onay mesajlarıyla iletişimi hızlandırın.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200/80 p-3 text-[11px] text-emerald-900">
                    <span className="font-bold">WhatsApp:</span> &ldquo;Saat 14:30 randevunuz onaylandı.&rdquo; ✓✓
                  </div>
                </SpotlightCard>

                <SpotlightCard
                  spotlightColor="rgba(244, 63, 94, 0.12)"
                  className="gsap-reveal-card bg-slate-50/70 p-7 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-5"
                >
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-5">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-900 mb-2">Finans &amp; Ciro Raporları</h3>
                    <p className="text-slate-600 leading-relaxed text-sm">
                      Günlük ve aylık kazançlarınızı, en çok tercih edilen hizmetleri ve personel performanslarını net grafiklerle takip edin.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white border border-slate-200/80 p-3 flex items-end gap-1.5 h-14">
                    {[38, 52, 46, 68, 84, 100, 74].map((h, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-t-md ${i === 5 ? 'bg-brand-600' : 'bg-slate-200'}`}
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </SpotlightCard>
              </div>

              {/* Extra Bottom Feature Strip */}
              <div className="mt-6">
                <SpotlightCard
                  spotlightColor="rgba(6, 182, 212, 0.12)"
                  className="gsap-reveal-card bg-slate-50/70 p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900">Müşteri Sorgulama &amp; CRM</h3>
                      <p className="text-slate-600 text-sm mt-0.5">
                        Müşteriler telefon numarasıyla kendi randevusunu sorgulayıp iptal edebilir; tüm müşteri geçmişi ve harcamaları otomatik kaydedilir.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/register"
                    className="shrink-0 px-5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs font-bold hover:border-brand-500 hover:text-brand-600 transition-colors text-center"
                  >
                    Hemen Dene &rarr;
                  </Link>
                </SpotlightCard>
              </div>
            </div>
          </section>

          {/* Dark Contrast CTA Band */}
          <section className="py-16 bg-slate-950 text-white relative overflow-hidden">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.25),transparent_55%)]"
            />
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
              <div className="space-y-2 max-w-xl">
                <span className="inline-block text-xs font-bold uppercase tracking-wider text-blue-400">
                  Hızlı Başlangıç
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  İşletmenizi Bugün Dijitale Taşıyın
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Ücretsiz Başlangıç paketi ile hemen hesabınızı açın; kredi kartı gerekmez, taahhüt ve gizli ücret yoktur.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <Link
                  href="/register"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-brand-600 text-white font-bold text-sm hover:bg-brand-500 transition-all shadow-lg shadow-brand-600/25 flex items-center justify-center gap-2"
                >
                  Ücretsiz Hesap Oluştur <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/10 text-white border border-white/15 font-semibold text-sm hover:bg-white/15 transition-all text-center"
                >
                  Paneli Gör
                </Link>
              </div>
            </div>
          </section>

          {/* Customer & Business Rating + 108 Reviews Section */}
          <ReviewsSection />

          {/* Subscription Plans Interactive Section with Monthly/Yearly Toggle */}
          <PricingSection />

          {/* Footer */}
          <footer className="bg-slate-900 text-slate-400 py-12 mt-auto border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <BrandLogo size="md" variant="dark" showSlogan={true} />
                <p className="text-xs text-slate-500 text-center md:text-left">
                  &copy; {new Date().getFullYear()} RANDEVORY. Tüm hakları saklıdır. Profesyonel Randevu ve Hizmet Yönetim Platformu.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
                  <Link href="/nasil-kullanilir" className="hover:text-white transition-colors">Nasıl Kullanılır?</Link>
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
              <div className="pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
                <span>256-Bit SSL &amp; Shopier 3D Secure Korumalı Ödeme Altyapısı • Gizli Ücret Yok, Taahhüt Yok</span>
                <span>Resmi İletişim: destek@randevory.com • kvkk@randevory.com</span>
              </div>
            </div>
          </footer>
        </div>
      </HomeAnimations>
    </SmoothScrollProvider>
  );
}
