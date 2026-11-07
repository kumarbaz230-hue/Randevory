'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';
import { HomeNavbarAuth } from '@/components/home-navbar-auth';
import {
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  User,
  Scissors,
  Sparkles,
  Share2,
  Settings,
  ShieldCheck,
  Smartphone,
  ArrowRight,
  Lightbulb,
  Building2,
  Users,
  TrendingUp,
} from 'lucide-react';

export default function HowItWorksGuidePage() {
  const [activeTab, setActiveTab] = useState<'customer' | 'business'>('customer');
  const [tutorialStep, setTutorialStep] = useState<number>(1);
  const [selectedServiceIdx, setSelectedServiceIdx] = useState<number>(0);
  const [selectedStaffIdx, setSelectedStaffIdx] = useState<number>(0);
  const [selectedTime, setSelectedTime] = useState<string>('14:30');

  const sampleServices = [
    { name: 'Profesyonel Saç Kesimi & Şekillendirme', duration: '45 dk', price: '450 ₺', category: 'Saç Bakımı' },
    { name: 'Cilt Bakımı & Yüz Maskesi', duration: '60 dk', price: '750 ₺', category: 'Bakım' },
    { name: 'Periyodik Bakım / VIP Hizmet Seansı', duration: '30 dk', price: '350 ₺', category: 'Hızlı Seans' },
  ];

  const sampleStaff = [
    { name: 'Fark Etmez (İlk Müsait Uzman)', role: 'Otomatik Eşleştirme', color: '#475569' },
    { name: 'Emre Yılmaz', role: 'Kıdemli Uzman', color: '#2563eb' },
    { name: 'Zeynep Kaya', role: 'Bakım Uzmanı', color: '#7c3aed' },
  ];

  const sampleSlots = ['10:00', '10:45', '11:30', '13:00', '14:30', '15:15', '16:00', '17:30'];

  const customerStepGuides = [
    {
      step: 1,
      title: '1. Adım: Müşteriniz Hizmet ve Fiyatı Seçer',
      desc: 'Müşteriniz size özel bağlantıya (örn: randevory.com/isletmeniz) tıkladığında, yönetim panelinde tanımladığınız güncel hizmet listesini, seans sürelerini ve fiyatlarını net bir şekilde görür.',
      tip: 'Uygulama indirme veya üyelik şartı yoktur. Instagram biyografinizden veya WhatsApp üzerinden tek tıkla açılır.',
      benefits: [
        'Telefonla "Fiyatınız nedir?" sorularını ortadan kaldırır.',
        'Her hizmetin kaç dakika süreceği şeffafça görünür.',
        'İstediğiniz zaman panelden fiyatları güncelleyebilirsiniz.',
      ],
    },
    {
      step: 2,
      title: '2. Adım: Personel veya Uzman Tercihi Yapar',
      desc: 'Müşteriniz isterse kendi tanıdığı uzmanı seçer, isterse "Fark Etmez (En Uygun Uzman)" seçeneğiyle seçtiği saatte müsait olan ilk personelle otomatik eşleşir.',
      tip: 'Her personelin verebildiği hizmetleri panelden ayrı ayrı belirleyebilirsiniz.',
      benefits: [
        'Sadece seçilen hizmeti verebilen uzmanlar listelenir.',
        'Personellerinizin iş yükü dengeli dağılır.',
        'Tek kişilik işletmelerde bu adım hızlıca geçilir.',
      ],
    },
    {
      step: 3,
      title: '3. Adım: Çakışma Korumalı Gün ve Saat Seçimi',
      desc: 'Akıllı randevu motoru; işletmenizin çalışma saatlerini, seçilen hizmetin süresini ve mevcut dolu randevuları hesaplayarak SADECE gerçekten müsait olan saatleri gösterir.',
      tip: 'Dolu olan saatler listede hiç görünmez. Aynı personele aynı saatte iki randevu alınması %100 imkansızdır.',
      benefits: [
        '%0 randevu çakışma garantisi (GIST veritabanı kilidi).',
        'Kapalı olduğunuz günler otomatik olarak devre dışı kalır.',
        '15, 30, 45 veya 60 dakikalık aralıkları siz belirlersiniz.',
      ],
    },
    {
      step: 4,
      title: '4. Adım: İletişim Bilgileri ve Anında Randevu Onayı',
      desc: 'Müşteriniz yalnızca Ad Soyad ve Telefon Numarasını yazarak randevusunu tamamlar. Randevu anında sizin Yönetim Panelinize ve Müşteri Veritabanınıza (CRM) düşer.',
      tip: 'İsterseniz randevular otomatik onaylanır, isterseniz sizin manuel onayınıza düşecek şekilde ayarlanır.',
      benefits: [
        '30 saniyenin altında tamamlanan pürüzsüz deneyim.',
        'Müşteri otomatik olarak CRM rehberinize kaydedilir.',
        'Randevu numarası ve özet fişi ekranda anında oluşturulur.',
      ],
    },
  ];

  const currentGuide = customerStepGuides[tutorialStep - 1];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/95 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <BrandLogo size="md" showBadge={true} showSlogan={false} />

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
            <Link href="/#features" className="hover:text-slate-900 transition-colors">Özellikler</Link>
            <Link href="/#sectors" className="hover:text-slate-900 transition-colors">Sektörler</Link>
            <Link href="/#yorumlar" className="hover:text-slate-900 transition-colors">Yorumlar</Link>
            <Link href="/#plans" className="hover:text-slate-900 transition-colors">Paketler</Link>
            <Link href="/nasil-kullanilir" className="text-brand-600 font-bold">Nasıl Kullanılır?</Link>
          </nav>

          <HomeNavbarAuth />
        </div>
      </header>

      {/* Hero Header */}
      <section className="bg-slate-900 text-white py-12 sm:py-16 border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/20 border border-brand-400/30 text-brand-300 text-xs font-semibold mb-4">
            <BookOpen className="w-4 h-4" />
            Adım Adım İnteraktif Kullanım Rehberi
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            RANDEVORY Nasıl Çalışır ve Nasıl Kullanılır?
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            İster müşterilerinizin nasıl saniyeler içinde randevu aldığını adım adım inceleyin, ister işletmenizi 3 dakikada nasıl kuracağınızı öğrenin.
          </p>

          {/* Mode Switcher Tabs */}
          <div className="mt-8 inline-flex p-1.5 rounded-2xl bg-slate-800 border border-slate-700">
            <button
              type="button"
              onClick={() => setActiveTab('customer')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'customer'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              1. Müşteriler Nasıl Randevu Alır?
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('business')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'business'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              2. İşletme Kurulumu Nasıl Yapılır?
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        {activeTab === 'customer' ? (
          <div className="space-y-8">
            {/* Step Selector Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto">
              {customerStepGuides.map((g) => (
                <button
                  key={g.step}
                  type="button"
                  onClick={() => setTutorialStep(g.step)}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    tutorialStep === g.step
                      ? 'bg-brand-600 text-white border-brand-600 shadow-lg shadow-brand-600/20'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-brand-300'
                  }`}
                >
                  <div className="text-[11px] font-bold uppercase opacity-80">Adım {g.step}</div>
                  <div className="text-xs font-extrabold mt-0.5 truncate">
                    {g.step === 1
                      ? 'Hizmet & Fiyat Seçimi'
                      : g.step === 2
                      ? 'Uzman Seçimi'
                      : g.step === 3
                      ? 'Tarih & Saat Seçimi'
                      : 'Onay & Bildirim'}
                  </div>
                </button>
              ))}
            </div>

            {/* Interactive Split View: Left = Educational Explanation, Right = Interactive Simulator */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Educational Guide */}
              <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  Öğretici Rehber • Adım {tutorialStep} / 4
                </div>

                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
                    {currentGuide.title}
                  </h2>
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                    {currentGuide.desc}
                  </p>
                </div>

                {/* Pro Tip Callout */}
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-800">
                    <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
                    Nasıl Kullanılır İpucu:
                  </div>
                  <p className="leading-relaxed">{currentGuide.tip}</p>
                </div>

                {/* Benefits List */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    İşletmenize Sağladığı Avantajlar
                  </div>
                  {currentGuide.benefits.map((b, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>

                {/* Step Navigation Buttons */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                  <button
                    type="button"
                    disabled={tutorialStep === 1}
                    onClick={() => setTutorialStep((s) => Math.max(1, s - 1))}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" /> Önceki Adım
                  </button>

                  {tutorialStep < 4 ? (
                    <button
                      type="button"
                      onClick={() => setTutorialStep((s) => Math.min(4, s + 1))}
                      className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 shadow-sm flex items-center gap-1.5"
                    >
                      Sonraki Adımı Gör <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveTab('business')}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-sm flex items-center gap-1.5"
                    >
                      İşletme Kurulumuna Geç <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Right Column: Interactive Annotated Screen Simulator */}
              <div className="lg:col-span-7 bg-white rounded-2xl border-2 border-slate-200 shadow-lg overflow-hidden">
                {/* Browser / Phone Mock Top Bar */}
                <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="ml-2 px-3 py-1 rounded-md bg-slate-800 text-[11px] font-mono text-brand-300 border border-slate-700">
                      randevory.com/sizin-isletmeniz
                    </span>
                  </div>
                  <span className="text-[11px] bg-brand-600/30 text-brand-200 px-2.5 py-0.5 rounded-full border border-brand-500/30 font-semibold">
                    İnteraktif Önizleme
                  </span>
                </div>

                {/* Annotated Instruction Banner */}
                <div className="bg-brand-50/80 border-b border-brand-100 px-6 py-3 flex items-center justify-between text-xs text-brand-900">
                  <span className="font-semibold">
                    👇 Aşağıdaki seçeneklere tıklayarak müşterinizin deneyimini test edebilirsiniz:
                  </span>
                  <span className="font-bold text-brand-700">Adım {tutorialStep}/4</span>
                </div>

                <div className="p-6 sm:p-8">
                  {/* STEP 1 PREVIEW */}
                  {tutorialStep === 1 && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          1. Almak İstediğiniz Hizmeti Seçin
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Müşteriniz işletmenizin sunduğu hizmetlerden birine tıklar:
                        </p>
                      </div>

                      <div className="space-y-3">
                        {sampleServices.map((srv, idx) => (
                          <div
                            key={idx}
                            onClick={() => setSelectedServiceIdx(idx)}
                            className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                              selectedServiceIdx === idx
                                ? 'border-brand-600 bg-brand-50/40 ring-2 ring-brand-500/20'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div>
                              <div className="font-bold text-slate-900 text-sm">{srv.name}</div>
                              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-brand-600" /> {srv.duration}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                  {srv.category}
                                </span>
                              </div>
                            </div>
                            <div className="text-base font-extrabold text-slate-900">{srv.price}</div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setTutorialStep(2)}
                          className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 flex items-center gap-1.5"
                        >
                          2. Adıma Geç (Personel Seçimi) <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 2 PREVIEW */}
                  {tutorialStep === 2 && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          2. Hizmet Alacağınız Uzmanı Seçin
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Müşteriniz istediği personeli seçer veya sistem en uygun uzmanı atar:
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {sampleStaff.map((st, idx) => (
                          <div
                            key={idx}
                            onClick={() => setSelectedStaffIdx(idx)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${
                              selectedStaffIdx === idx
                                ? 'border-brand-600 bg-brand-50/40 ring-2 ring-brand-500/20'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div
                              className="w-10 h-10 rounded-xl text-white font-bold flex items-center justify-center mb-2.5 text-sm"
                              style={{ backgroundColor: st.color }}
                            >
                              {st.name.charAt(0)}
                            </div>
                            <div className="font-bold text-slate-900 text-xs">{st.name}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{st.role}</div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4 flex justify-between">
                        <button
                          type="button"
                          onClick={() => setTutorialStep(1)}
                          className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                        >
                          Geri
                        </button>
                        <button
                          type="button"
                          onClick={() => setTutorialStep(3)}
                          className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 flex items-center gap-1.5"
                        >
                          3. Adıma Geç (Saat Seçimi) <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 3 PREVIEW */}
                  {tutorialStep === 3 && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          3. Müsait Gün ve Saat Seçimi
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Sadece personelin gerçekten boş olduğu saat dilimleri listelenir:
                        </p>
                      </div>

                      <div className="grid grid-cols-4 gap-2.5">
                        {sampleSlots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedTime(slot)}
                            className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                              selectedTime === slot
                                ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                                : 'bg-white text-slate-800 border-slate-200 hover:border-brand-400'
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>

                      <div className="p-3.5 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-brand-800">Seçilen Özet: </span>
                          <span className="text-slate-700">
                            {sampleServices[selectedServiceIdx].name} • Saat {selectedTime}
                          </span>
                        </div>
                        <span className="font-extrabold text-brand-700">
                          {sampleServices[selectedServiceIdx].price}
                        </span>
                      </div>

                      <div className="pt-4 flex justify-between">
                        <button
                          type="button"
                          onClick={() => setTutorialStep(2)}
                          className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                        >
                          Geri
                        </button>
                        <button
                          type="button"
                          onClick={() => setTutorialStep(4)}
                          className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 flex items-center gap-1.5"
                        >
                          4. Adıma Geç (Onay Ekranı) <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 4 PREVIEW */}
                  {tutorialStep === 4 && (
                    <div className="text-center py-4 space-y-4">
                      <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-lg font-extrabold text-slate-900">
                          Randevu Anında Oluşturuldu ve Takviminize Düştü!
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                          Müşteriniz adını ve telefonunu yazıp onayladığı anda hem müşterinize randevu fişi gösterilir hem de sizin Yönetim Panelinizdeki takvime eklenir.
                        </p>
                      </div>

                      <div className="max-w-sm mx-auto p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Hizmet:</span>
                          <span className="font-bold text-slate-900">{sampleServices[selectedServiceIdx].name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Uzman:</span>
                          <span className="font-bold text-slate-900">{sampleStaff[selectedStaffIdx].name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Saat:</span>
                          <span className="font-bold text-slate-900">Bugün - {selectedTime}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-slate-200">
                          <span className="text-slate-500">Ücret:</span>
                          <span className="font-extrabold text-brand-600">{sampleServices[selectedServiceIdx].price}</span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <Link
                          href="/register"
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 shadow-md"
                        >
                          Şimdi Kendi İşletme Sayfanızı Oluşturun <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* TAB 2: BUSINESS OWNER 4-STEP SETUP GUIDE */
          <div className="space-y-10 max-w-5xl mx-auto">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                İşletmenizi 4 Kolay Adımda Kurun ve Yönetin
              </h2>
              <p className="text-sm text-slate-600 mt-2">
                Teknik bilgiye ihtiyaç duymadan dakikalar içinde online randevu kabul etmeye başlayabilirsiniz.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-brand-600 text-white font-extrabold flex items-center justify-center">
                  1
                </div>
                <h3 className="text-lg font-bold text-slate-900">Ücretsiz Hesap ve İşletme Oluşturun</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Kayıt olduktan sonra işletme adınızı, sektörünüzü ve şehrinizi girin. Sistem işletmenize özel <strong>randevory.com/isletme-adiniz</strong> bağlantısını otomatik olarak üretir.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-brand-600 text-white font-extrabold flex items-center justify-center">
                  2
                </div>
                <h3 className="text-lg font-bold text-slate-900">Hizmetlerinizi ve Fiyatlarınızı Ekleyin</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>Hizmetler & Fiyatlar</strong> menüsünden verdiğiniz hizmetleri, kaç dakika sürdüğünü ve ücretini tanımlayın. Müşterileriniz randevu alırken bu süreye göre boş saatleri görür.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-brand-600 text-white font-extrabold flex items-center justify-center">
                  3
                </div>
                <h3 className="text-lg font-bold text-slate-900">Personel ve Mesai Saatlerinizi Ayarlayın</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>Personel Yönetimi</strong> ve <strong>İşletme Ayarları</strong> menüsünden çalışanlarınızı, takvim renklerini ve haftalık çalışma saatlerinizi (açılış/kapanış ve tatil günleri) belirleyin.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-brand-600 text-white font-extrabold flex items-center justify-center">
                  4
                </div>
                <h3 className="text-lg font-bold text-slate-900">Linkinizi Paylaşın & Takvimden Yönetin</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Paneldeki <strong>Özel Randevu Bağlantınızı</strong> tek tıkla kopyalayıp Instagram biyografinize, WhatsApp işletme profilinize veya Google Haritalar kaydınıza yapıştırın.
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-brand-600 to-blue-700 rounded-2xl p-8 text-white text-center space-y-4 shadow-lg">
              <h3 className="text-xl sm:text-2xl font-extrabold">
                Hemen İşletmenizi Oluşturmaya Hazır mısınız?
              </h3>
              <p className="text-xs sm:text-sm text-brand-100 max-w-xl mx-auto">
                Başlangıç paketiyle kredi kartı gerekmeden ücretsiz olarak hesabınızı açın ve randevularınızı profesyonelce yönetin.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/register"
                  className="px-6 py-3 rounded-xl bg-white text-brand-700 font-bold text-xs sm:text-sm hover:bg-brand-50 transition-colors shadow-sm"
                >
                  Ücretsiz İşletme Hesabı Oluştur
                </Link>
                <Link
                  href="/login"
                  className="px-6 py-3 rounded-xl bg-white/10 text-white border border-white/20 font-semibold text-xs sm:text-sm hover:bg-white/20 transition-colors"
                >
                  Mevcut Hesabınıza Giriş Yapın
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <BrandLogo size="sm" variant="dark" showSlogan={true} />
          <span>&copy; {new Date().getFullYear()} RANDEVORY. Tüm hakları saklıdır.</span>
        </div>
      </footer>
    </div>
  );
}
