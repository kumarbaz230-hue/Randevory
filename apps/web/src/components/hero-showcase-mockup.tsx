'use client';

import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  MessageSquare,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import { RevenueFlowCanvas } from './revenue-flow-canvas';

type ShowcaseTab = 'dashboard' | 'mobile' | 'automation';

export function HeroShowcaseMockup() {
  const [activeTab, setActiveTab] = useState<ShowcaseTab>('dashboard');
  const [selectedSlot, setSelectedSlot] = useState('14:30');
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: -y * 4, ry: x * 4 });
  };

  const resetTilt = () => setTilt({ rx: 0, ry: 0 });

  return (
    <div className="gsap-hero-item mt-12 sm:mt-14 max-w-5xl mx-auto">
      {/* Switcher Bar */}
      <div className="flex items-center justify-center mb-5">
        <div className="inline-flex flex-wrap justify-center gap-1 p-1.5 rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/10 shadow-lg">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-brand-600 to-blue-500 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            İşletme Paneli
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mobile')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'mobile'
                ? 'bg-gradient-to-r from-brand-600 to-blue-500 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Müşteri Ekranı
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('automation')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'automation'
                ? 'bg-gradient-to-r from-brand-600 to-blue-500 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            QR &amp; WhatsApp
          </button>
        </div>
      </div>

      {/* Glowing Outer Frame with Subtle 3D Tilt */}
      <div
        onMouseMove={handleMouseMove}
        onMouseLeave={resetTilt}
        style={{
          transform: `perspective(1400px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transition: 'transform 220ms ease-out',
        }}
        className="relative rounded-3xl p-[1px] bg-gradient-to-b from-blue-400/45 via-indigo-500/20 to-white/5 shadow-[0_30px_90px_-15px_rgba(37,99,235,0.35)] will-change-transform"
      >
        <div className="relative rounded-[23px] bg-slate-900/95 backdrop-blur-2xl overflow-hidden">
          {/* Browser Chrome */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-white/[0.03] border-b border-white/10">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400/90" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400/90" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/90" />
            </div>
            <div className="px-3 py-1 rounded-lg bg-white/[0.06] border border-white/10 text-[11px] font-medium text-slate-300 truncate max-w-[190px] sm:max-w-xs">
              {activeTab === 'dashboard'
                ? 'randevory.com/dashboard/calendar'
                : activeTab === 'mobile'
                ? 'randevory.com/studio-demir'
                : 'randevory.com/qr-vitrin'}
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-400/25">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Canlı Senkron
            </div>
          </div>

          {activeTab === 'dashboard' ? (
            <div className="p-4 sm:p-6 lg:p-8 text-left space-y-5">
              {/* Top Summary Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span>Bugünkü Randevu</span>
                    <Calendar className="w-3.5 h-3.5 text-sky-400" />
                  </div>
                  <div className="mt-1.5 text-xl sm:text-2xl font-extrabold text-white">18</div>
                  <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">+4 yeni talep</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span>Günlük Ciro</span>
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="mt-1.5 text-xl sm:text-2xl font-extrabold text-white">9.450 ₺</div>
                  <div className="text-[10px] text-slate-400 font-medium mt-0.5">Tamamlanan işlemler</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span>Çakışma Riski</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                  </div>
                  <div className="mt-1.5 text-xl sm:text-2xl font-extrabold text-emerald-400">%0</div>
                  <div className="text-[10px] text-slate-400 font-medium mt-0.5">GIST kilit aktif</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span>Doluluk Oranı</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="mt-1.5 text-xl sm:text-2xl font-extrabold text-white">%92</div>
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-sky-400 to-indigo-400" />
                  </div>
                </div>
              </div>

              {/* Canvas Graph + Live Appointments */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-5">
                  <RevenueFlowCanvas dark={true} />
                </div>

                <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-white/[0.03] divide-y divide-white/10">
                  <div className="px-4 py-3 flex items-center justify-between bg-white/[0.02] rounded-t-2xl">
                    <span className="text-xs font-bold text-white">Bugünün Akıllı Takvimi</span>
                    <span className="text-[11px] text-sky-400 font-semibold">Otomatik Sıralı</span>
                  </div>

                  {[
                    {
                      time: '13:00',
                      name: 'Emre Kaya',
                      service: 'Saç & Sakal Bakımı',
                      staff: 'Melih Usta',
                      price: '550 ₺',
                      status: 'Tamamlandı',
                      badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
                    },
                    {
                      time: '14:30',
                      name: 'Caner Yılmaz',
                      service: 'Cilt Bakımı & Şekillendirme',
                      staff: 'Kerem Bey',
                      price: '700 ₺',
                      status: 'Onaylandı',
                      badge: 'bg-sky-500/15 text-sky-300 border-sky-400/30',
                    },
                    {
                      time: '16:00',
                      name: 'Burak Demirci',
                      service: 'Klasik Kesim',
                      staff: 'Melih Usta',
                      price: '400 ₺',
                      status: 'WhatsApp İletildi',
                      badge: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
                    },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 hover:bg-white/[0.03] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="px-2.5 py-1 rounded-lg bg-white/10 text-white font-bold text-xs shrink-0">
                          {item.time}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{item.name}</div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {item.service} • {item.staff}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="text-xs font-bold text-slate-200">{item.price}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${item.badge}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : activeTab === 'mobile' ? (
            /* Interactive Customer Mobile View */
            <div className="p-4 sm:p-8">
              <div className="max-w-md mx-auto rounded-3xl border border-white/15 bg-slate-950/90 shadow-2xl p-5 text-left space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 text-white font-extrabold text-sm flex items-center justify-center">
                      SD
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Studio Demir</div>
                      <div className="text-[11px] text-slate-400">Üyeliksiz 30 sn&apos;de randevu al</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                    Açık
                  </span>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    1. Hizmet Seçimi
                  </div>
                  <div className="p-3 rounded-xl border border-sky-400/40 bg-sky-500/10 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">Saç Kesimi &amp; Bakım</div>
                      <div className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-sky-400" /> 45 dk • Melih Usta
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-sky-300">450 ₺</span>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    2. Müsait Saat (Tıklayıp Deneyin)
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {['13:30', '14:30', '15:45', '17:00'].map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          selectedSlot === slot
                            ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-sm shadow-sky-400/30'
                            : 'bg-white/[0.04] text-slate-300 border-white/10 hover:border-sky-400/50'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs bg-emerald-500/10 border border-emerald-400/25 rounded-xl p-3 text-emerald-300">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    Seçilen saat: <strong className="text-white">{selectedSlot}</strong>
                  </span>
                  <span className="text-[11px] font-bold">Çakışma Yok</span>
                </div>
              </div>
            </div>
          ) : (
            /* QR Vitrin & WhatsApp UI Drawing */
            <div className="p-4 sm:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 flex items-center gap-4">
                  <div className="w-24 h-24 rounded-2xl bg-white p-3 shrink-0 flex items-center justify-center relative shadow-lg">
                    <QrCode className="w-full h-full text-slate-950" strokeWidth={1.6} />
                    <span className="absolute -bottom-2 px-2 py-0.5 rounded-full bg-brand-600 text-white text-[9px] font-bold">
                      7/24 Tara
                    </span>
                  </div>
                  <div className="min-w-0 space-y-1.5">
                    <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-sky-300 bg-sky-500/15 px-2 py-0.5 rounded-md border border-sky-400/25">
                      Baskıya Hazır Vitrin Afişi
                    </div>
                    <h4 className="text-sm font-extrabold text-white">Kamerayı Okut, Anında Sıra Al</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      İşletmenize özel QR kod tek tıkla A4 afiş olarak indirilir; camınıza veya masanıza koyabilirsiniz.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                      Tek Tıkla WhatsApp Onayı
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-200 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/30">
                      Hazır Şablon
                    </span>
                  </div>
                  <div className="rounded-2xl rounded-tl-none bg-slate-950/70 border border-emerald-400/20 p-3.5 text-xs text-slate-200 leading-relaxed">
                    Merhaba <strong className="text-white">Caner Bey</strong>, bugün saat{' '}
                    <strong className="text-sky-300">14:30</strong> randevunuz onaylanmıştır. Sizi bekliyoruz!
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-emerald-300 font-semibold">
                    <UserCheck className="w-3.5 h-3.5" />
                    Müşteri yanıtı ve canlı sohbet panelinize düşer
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
