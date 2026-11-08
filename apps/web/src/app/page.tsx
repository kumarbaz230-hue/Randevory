import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';
import { HomeHeader } from '@/components/home-header';
import { ReviewsSection } from '@/components/reviews-section';
import { PricingSection } from '@/components/pricing-section';
import {
  Calendar,
  Clock,
  ShieldCheck,
  Smartphone,
  Users,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Scissors,
  Wrench,
  GraduationCap,
  HeartPulse,
  Laptop,
  CheckCircle2,
  BookOpen,
  Star,
  QrCode,
  MessageSquare,
} from 'lucide-react';

export default function HomePage() {
  const sectors = [
    { name: 'Kuaför & Berberler', icon: Scissors, desc: 'Saç, sakal ve bakım seansları' },
    { name: 'Oto Bakım & Detailing', icon: Wrench, desc: 'Periyodik bakım ve yıkama' },
    { name: 'Özel Ders & Eğitim', icon: GraduationCap, desc: 'Birebir ders ve danışmanlık' },
    { name: 'Veteriner Klinikleri', icon: HeartPulse, desc: 'Muayene ve aşı takvimi' },
    { name: 'Teknik Servisler', icon: Laptop, desc: 'Cihaz onarım ve randevu' },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Navbar & Mobile Quick Nav */}
      <HomeHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32 bg-gradient-to-b from-white via-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold mb-8 animate-fade-in shadow-sm">
            <Sparkles className="w-4 h-4 text-brand-600" />
            <span>Çok Sektörlü & Yeni Nesil Randevu Altyapısı</span>
            <span className="text-slate-300">•</span>
            <a href="#yorumlar" className="inline-flex items-center gap-1 text-amber-700 hover:underline font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              4.7/5 (108+ Yorum)
            </a>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.15]">
            İşletmeniz İçin <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-blue-500">Kusursuz</span> Randevu ve Personel Yönetimi
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Telefon trafiğine ve randevu çakışmalarına son verin. Müşterileriniz QR kod veya link ile 7/24 randevu alsın, WhatsApp ve canlı sohbet ile anında haberleşin.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-brand-600 text-white font-semibold shadow-lg shadow-brand-600/25 hover:bg-brand-700 transition-all flex items-center justify-center gap-2"
            >
              Yönetim Panelini İncele <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/nasil-kullanilir"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-slate-800 border border-slate-300 font-semibold hover:bg-slate-50 hover:border-slate-400 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <BookOpen className="w-4 h-4 text-brand-600" />
              Nasıl Kullanılır? (Adım Adım Rehber)
            </Link>
          </div>

          {/* Quick Stats Badges */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 border-t border-slate-200">
            <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-slate-200/80 shadow-sm">
              <div className="text-2xl font-bold text-slate-900">%0</div>
              <div className="text-xs text-slate-500 mt-1 font-medium">Çakışma Garantisi (GIST Lock)</div>
            </div>
            <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-slate-200/80 shadow-sm">
              <div className="text-2xl font-bold text-slate-900">7/24</div>
              <div className="text-xs text-slate-500 mt-1 font-medium">Kesintisiz Randevu Alma</div>
            </div>
            <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-slate-200/80 shadow-sm">
              <div className="text-2xl font-bold text-slate-900">&lt; 30 sn</div>
              <div className="text-xs text-slate-500 mt-1 font-medium">Müşteri Randevu Tamamlama</div>
            </div>
            <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-slate-200/80 shadow-sm">
              <div className="text-2xl font-bold text-amber-500 flex items-center justify-center gap-1">
                4.7 <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              </div>
              <div className="text-xs text-slate-500 mt-1 font-medium">1.840+ Beğeni & Memnuniyet</div>
            </div>
          </div>
        </div>
      </section>

      {/* Step-by-Step How It Works Section */}
      <section id="nasil-calisir" className="scroll-mt-28 py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-brand-600 font-semibold text-xs uppercase tracking-wider">Adım Adım Sistem Rehberi</span>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 mt-2">
              RANDEVORY Nasıl Kullanılır?
            </h2>
            <p className="mt-3 text-slate-600 text-sm">
              Hem işletmeniz hem de müşterileriniz için 4 basit adımda kusursuz randevu yönetimi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/60 relative">
              <div className="w-9 h-9 rounded-xl bg-brand-600 text-white font-extrabold text-sm flex items-center justify-center mb-4">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-base">İşletmenizi Tanımlayın</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Kayıt olun, hizmetlerinizi, seans sürelerinizi ve personellerinizin çalışma saatlerini birkaç dakikada girin.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/60 relative">
              <div className="w-9 h-9 rounded-xl bg-brand-600 text-white font-extrabold text-sm flex items-center justify-center mb-4">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-base">Link veya QR Kod Paylaşın</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Size özel <strong>randevory.com/isletmeniz</strong> linkini Instagram profilinize ekleyin veya hazır Vitrin QR Afişini camınıza asın.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/60 relative">
              <div className="w-9 h-9 rounded-xl bg-brand-600 text-white font-extrabold text-sm flex items-center justify-center mb-4">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-base">Müşteriniz Saatini Seçsin</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Müşterileriniz uygulama indirmeden veya üye olmadan; hizmet, uzman ve müsait saati seçerek 30 saniyede randevu alsın.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/60 relative">
              <div className="w-9 h-9 rounded-xl bg-brand-600 text-white font-extrabold text-sm flex items-center justify-center mb-4">
                4
              </div>
              <h3 className="font-bold text-slate-900 text-base">WhatsApp & Takvim Yönetimi</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Tüm randevuları akıllı takvimde görün, tek tıkla WhatsApp onayı gönderin, canlı sohbet ve aylık cironuzu takip edin.
              </p>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/nasil-kullanilir"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-all shadow-sm"
            >
              İnteraktif Müşteri & İşletme Rehberini Aç <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Sectors Interactive Showcase */}
      <section id="sectors" className="scroll-mt-28 py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Tek Bir Sektöre Değil, Randevulu Tüm İşletmelere Özel
            </h2>
            <p className="mt-3 text-slate-600">
              Her sektörün dinamikleri farklıdır. Seans sürelerinizi, mola aralıklarınızı ve personel yetkinliklerinizi ihtiyacınıza göre özelleştirin.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {sectors.map((sector, idx) => {
              const Icon = sector.icon;
              return (
                <Link
                  key={idx}
                  href="/nasil-kullanilir"
                  className="group p-6 rounded-2xl border border-slate-200 bg-white hover:border-brand-500 hover:shadow-lg hover:shadow-brand-500/10 transition-all flex flex-col items-center text-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 group-hover:bg-brand-50 group-hover:border-brand-300 flex items-center justify-center text-slate-700 group-hover:text-brand-600 transition-colors shadow-sm mb-4">
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">
                    {sector.name}
                  </h3>
                  <span className="text-xs text-slate-500 mt-2">
                    {sector.desc} &rarr;
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section id="features" className="scroll-mt-28 py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-brand-600 font-semibold text-sm uppercase tracking-wider">İşletmenizi Büyütün</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mt-2">
              Profesyonel Yönetim İçin Gereken Her Şey
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50/60 p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center mb-6">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Akıllı Randevu Takvimi</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                Günlük, haftalık ve personel bazlı görünümler. Randevuları tek tıkla onaylayın, tamamlayın veya WhatsApp mesajı gönderin.
              </p>
            </div>

            <div className="bg-slate-50/60 p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Çakışma Önleme Motoru</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                Aynı personele aynı saat diliminde iki randevu verilmesini hem veritabanı kısıtlarıyla hem de algoritmayla kesinlikle engeller.
              </p>
            </div>

            <div className="bg-slate-50/60 p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">QR Kod & Vitrin Afişi</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                İşletmenize özel yüksek çözünürlüklü QR kod ve baskıya hazır vitrin afişini tek tıkla indirin; müşterileriniz kamerayla okutup randevu alsın.
              </p>
            </div>

            <div className="bg-slate-50/60 p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Canlı Sohbet & WhatsApp</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                Müşterileriniz randevu sayfasından size anlık mesaj yazsın, randevu sonrası hazır WhatsApp onay mesajlarıyla iletişimi hızlandırın.
              </p>
            </div>

            <div className="bg-slate-50/60 p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Finans & Ciro Raporları</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                Günlük ve aylık kazançlarınızı, en çok tercih edilen hizmetleri ve personel performanslarını grafiklerle takip edin.
              </p>
            </div>

            <div className="bg-slate-50/60 p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-6">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Müşteri Sorgulama & CRM</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                Müşteriler telefon numarasıyla kendi randevusunu sorgulayıp iptal edebilir; tüm müşteri geçmişi ve harcamaları otomatik kaydedilir.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Customer & Business Rating + 108 Reviews Section */}
      <ReviewsSection />

      {/* Subscription Plans Interactive Section with Monthly/Yearly Toggle */}
      <PricingSection />

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 mt-auto border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <BrandLogo size="md" variant="dark" showSlogan={true} />
          <p className="text-xs text-slate-500 text-center md:text-left">
            &copy; {new Date().getFullYear()} RANDEVORY. Tüm hakları saklıdır. Profesyonel Randevu ve Hizmet Yönetim Platformu.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-5 text-xs">
            <Link href="/nasil-kullanilir" className="hover:text-white transition-colors">Nasıl Kullanılır?</Link>
            <a href="#yorumlar" className="hover:text-white transition-colors">Kullanıcı Yorumları</a>
            <Link href="/yasal#hizmet-sozlesmesi" className="hover:text-white transition-colors">Hizmet Sözleşmesi</Link>
            <Link href="/yasal#iptal-iade" className="hover:text-white transition-colors">İptal & İade Koşulları</Link>
            <Link href="/yasal#kvkk" className="hover:text-white transition-colors">Gizlilik & KVKK</Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">Yönetim Paneli</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
