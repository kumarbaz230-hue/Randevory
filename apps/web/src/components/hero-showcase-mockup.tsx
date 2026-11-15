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

  return (
    <div className="gsap-hero-item mt-12 sm:mt-14 max-w-5xl mx-auto">
      {/* Switcher Bar */}
      <div className="flex items-center justify-center mb-5">
        <div className="inline-flex flex-wrap justify-center gap-1 p-1 rounded-2xl bg-slate-200/80 backdrop-blur border border-slate-300/70 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'dashboard'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-brand-600" />
            İşletme Paneli
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mobile')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'mobile'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-brand-600" />
            Müşteri Ekranı
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('automation')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'automation'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-brand-600" />
            QR &amp; WhatsApp
          </button>
        </div>
      </div>

      {/* Main Showcase Window */}
      <div className="relative rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-xl shadow-[0_24px_70px_-15px_rgba(15,23,42,0.16)] overflow-hidden">
        {/* Browser Chrome */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-50/90 border-b border-slate-200/80">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>
          <div className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-medium text-slate-500 truncate max-w-[190px] sm:max-w-xs">
            {activeTab === 'dashboard'
              ? 'randevory.com/dashboard/calendar'
              : activeTab === 'mobile'
              ? 'randevory.com/studio-demir'
              : 'randevory.com/qr-vitrin'}
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Canlı Senkron
          </div>
        </div>

        {activeTab === 'dashboard' ? (
          <div className="p-4 sm:p-6 lg:p-8 text-left space-y-5">
            {/* Top Summary Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>Bugünkü Randevu</span>
                  <Calendar className="w-3.5 h-3.5 text-brand-600" />
                </div>
                <div className="mt-1.5 text-xl sm:text-2xl font-extrabold text-slate-900">18</div>
                <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">+4 yeni talep</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>Günlük Ciro</span>
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="mt-1.5 text-xl sm:text-2xl font-extrabold text-slate-900">9.450 ₺</div>
                <div className="text-[10px] text-slate-500 font-medium mt-0.5">Tamamlanan işlemler</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>Çakışma Riski</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
                </div>
                <div className="mt-1.5 text-xl sm:text-2xl font-extrabold text-emerald-600">%0</div>
                <div className="text-[10px] text-slate-500 font-medium mt-0.5">GIST kilit aktif</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>Doluluk Oranı</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <div className="mt-1.5 text-xl sm:text-2xl font-extrabold text-slate-900">%92</div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-brand-600 to-blue-500" />
                </div>
              </div>
            </div>

            {/* Canvas Graph + Live Appointments */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-5">
                <RevenueFlowCanvas />
              </div>

              <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
                <div className="px-4 py-3 flex items-center justify-between bg-slate-50/70 rounded-t-2xl">
                  <span className="text-xs font-bold text-slate-800">Bugünün Akıllı Takvimi</span>
                  <span className="text-[11px] text-brand-600 font-semibold">Otomatik Sıralı</span>
                </div>

                {[
                  {
                    time: '13:00',
                    name: 'Emre Kaya',
                    service: 'Saç & Sakal Bakımı',
                    staff: 'Melih Usta',
                    price: '550 ₺',
                    status: 'Tamamlandı',
                    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                  },
                  {
                    time: '14:30',
                    name: 'Caner Yılmaz',
                    service: 'Cilt Bakımı & Şekillendirme',
                    staff: 'Kerem Bey',
                    price: '700 ₺',
                    status: 'Onaylandı',
                    badge: 'bg-blue-50 text-brand-700 border-blue-200',
                  },
                  {
                    time: '16:00',
                    name: 'Burak Demirci',
                    service: 'Klasik Kesim',
                    staff: 'Melih Usta',
                    price: '400 ₺',
                    status: 'WhatsApp İletildi',
                    badge: 'bg-amber-50 text-amber-700 border-amber-200',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="px-4 py-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold text-xs shrink-0">
                        {item.time}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">{item.name}</div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {item.service} • {item.staff}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-xs font-bold text-slate-900">{item.price}</span>
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
          <div className="p-4 sm:p-8 bg-gradient-to-b from-slate-50 to-white">
            <div className="max-w-md mx-auto rounded-3xl border border-slate-200 bg-white shadow-lg p-5 text-left space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-600 text-white font-extrabold text-sm flex items-center justify-center">
                    SD
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">Studio Demir</div>
                    <div className="text-[11px] text-slate-500">Üyeliksiz 30 sn&apos;de randevu al</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                  Açık
                </span>
              </div>

              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  1. Hizmet Seçimi
                </div>
                <div className="p-3 rounded-xl border-2 border-brand-500 bg-brand-50/40 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Saç Kesimi &amp; Bakım</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" /> 45 dk • Melih Usta
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-brand-700">450 ₺</span>
                </div>
              </div>

              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
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
                          ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-brand-400'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 text-emerald-800">
                <span className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Seçilen saat: <strong>{selectedSlot}</strong>
                </span>
                <span className="text-[11px] font-bold">Çakışma Yok</span>
              </div>
            </div>
          </div>
        ) : (
          /* QR Vitrin & WhatsApp UI Drawing */
          <div className="p-4 sm:p-8 bg-gradient-to-b from-slate-50 to-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
              {/* QR Poster UI Illustration */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-4">
                <div className="w-24 h-24 rounded-2xl bg-slate-950 p-3 shrink-0 flex items-center justify-center relative">
                  <QrCode className="w-full h-full text-white" strokeWidth={1.6} />
                  <span className="absolute -bottom-2 px-2 py-0.5 rounded-full bg-brand-600 text-white text-[9px] font-bold">
                    7/24 Tara
                  </span>
                </div>
                <div className="min-w-0 space-y-1.5">
                  <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">
                    Baskıya Hazır Vitrin Afişi
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-900">Kamerayı Okut, Anında Sıra Al</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    İşletmenize özel QR kod tek tıkla A4 afiş olarak indirilir; camınıza veya masanıza koyabilirsiniz.
                  </p>
                </div>
              </div>

              {/* WhatsApp Message Bubble UI Illustration */}
              <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    Tek Tıkla WhatsApp Onayı
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                    Hazır Şablon
                  </span>
                </div>
                <div className="rounded-2xl rounded-tl-none bg-white border border-emerald-200/80 p-3.5 text-xs text-slate-700 leading-relaxed shadow-xs">
                  Merhaba <strong className="text-slate-900">Caner Bey</strong>, bugün saat{' '}
                  <strong className="text-brand-700">14:30</strong> randevunuz onaylanmıştır. Sizi bekliyoruz!
                </div>
                <div className="flex items-center gap-2 text-[11px] text-emerald-700 font-semibold">
                  <UserCheck className="w-3.5 h-3.5" />
                  Müşteri yanıtı ve canlı sohbet panelinize düşer
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
