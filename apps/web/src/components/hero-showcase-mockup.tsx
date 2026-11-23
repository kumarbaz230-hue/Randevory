'use client';

import React, { useState } from 'react';
import { Calendar, Check, Clock, MessageSquare, QrCode, Smartphone } from 'lucide-react';
import { RevenueFlowCanvas } from './revenue-flow-canvas';

type ShowcaseTab = 'dashboard' | 'mobile' | 'automation';

/**
 * RANDEVORY ürün önizleme penceresi.
 * Sıcak taş/krem yüzeyler, ince hairline kenarlıklar ve monospace saat imza detayı kullanır.
 */
export function HeroShowcaseMockup() {
  const [activeTab, setActiveTab] = useState<ShowcaseTab>('dashboard');
  const [selectedSlot, setSelectedSlot] = useState('14:30');

  return (
    <div className="mt-8 sm:mt-10 max-w-5xl mx-auto">
      {/* Quiet Tab Switcher */}
      <div className="flex items-center justify-center sm:justify-start mb-4">
        <div className="inline-flex flex-wrap gap-1 p-1 rounded-xl bg-stone-200/75 border border-stone-900/10">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'dashboard'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Calendar className="w-4 h-4" strokeWidth={1.5} />
            İşletme paneli
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mobile')}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'mobile'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Smartphone className="w-4 h-4" strokeWidth={1.5} />
            Müşteri ekranı
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('automation')}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'automation'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <QrCode className="w-4 h-4" strokeWidth={1.5} />
            QR ve WhatsApp
          </button>
        </div>
      </div>

      {/* Product Window */}
      <div className="rounded-2xl border border-stone-900/10 bg-white shadow-[0_20px_50px_-12px_rgba(28,25,23,0.12)] overflow-hidden">
        {/* Window Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-[#f7f6f2] border-b border-stone-900/10">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
            <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
            <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
          </div>
          <div className="px-3 py-1 rounded-md bg-white border border-stone-900/10 text-[11px] font-mono text-stone-500 truncate max-w-[200px] sm:max-w-xs">
            {activeTab === 'dashboard'
              ? 'randevory.com/dashboard/calendar'
              : activeTab === 'mobile'
              ? 'randevory.com/studio-demir'
              : 'randevory.com/qr-vitrin'}
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-stone-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Senkron
          </div>
        </div>

        {activeTab === 'dashboard' ? (
          <div className="p-4 sm:p-6 text-left space-y-4">
            {/* Compact Stat Row (Numbers Only, No Sparklines/Decor) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-[#fafaf8] border border-stone-900/10">
                <div className="text-xs text-stone-500">Bugünkü randevu</div>
                <div className="mt-1 text-2xl font-medium font-mono tabular-nums text-stone-900">18</div>
                <div className="text-[11px] text-stone-500 mt-1 tabular-nums">+4 düne göre</div>
              </div>

              <div className="p-4 rounded-xl bg-[#fafaf8] border border-stone-900/10">
                <div className="text-xs text-stone-500">Günlük ciro</div>
                <div className="mt-1 text-2xl font-medium font-mono tabular-nums text-stone-900">9.450 ₺</div>
                <div className="text-[11px] text-stone-500 mt-1">Tamamlanan işlemler</div>
              </div>

              <div className="p-4 rounded-xl bg-[#fafaf8] border border-stone-900/10">
                <div className="text-xs text-stone-500">Çakışma kilidi</div>
                <div className="mt-1 text-2xl font-medium font-mono tabular-nums text-stone-900">0 hata</div>
                <div className="text-[11px] text-stone-500 mt-1">GIST veritabanı koruması</div>
              </div>

              <div className="p-4 rounded-xl bg-[#fafaf8] border border-stone-900/10">
                <div className="text-xs text-stone-500">Doluluk oranı</div>
                <div className="mt-1 text-2xl font-medium font-mono tabular-nums text-blue-700">%92</div>
                <div className="text-[11px] text-stone-500 mt-1 tabular-nums">16 / 18 saat dolu</div>
              </div>
            </div>

            {/* Main Chart + Schedule Table */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-5">
                <RevenueFlowCanvas />
              </div>

              <div className="lg:col-span-7 rounded-xl border border-stone-900/10 bg-white divide-y divide-stone-900/10">
                <div className="px-4 py-3 flex items-center justify-between bg-[#fafaf8] rounded-t-xl">
                  <span className="text-xs font-medium text-stone-900">Bugünün takvimi</span>
                  <span className="text-[11px] font-mono text-stone-500">15 Kasım</span>
                </div>

                {[
                  {
                    time: '13:00',
                    name: 'Emre Kaya',
                    service: 'Saç ve sakal bakımı',
                    staff: 'Melih Usta',
                    price: '550 ₺',
                    status: 'Tamamlandı',
                    active: false,
                  },
                  {
                    time: '14:30',
                    name: 'Caner Yılmaz',
                    service: 'Cilt bakımı ve şekillendirme',
                    staff: 'Kerem Bey',
                    price: '700 ₺',
                    status: 'Onaylandı',
                    active: true,
                  },
                  {
                    time: '16:00',
                    name: 'Burak Demirci',
                    service: 'Klasik kesim',
                    staff: 'Melih Usta',
                    price: '400 ₺',
                    status: 'WhatsApp iletildi',
                    active: false,
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`px-4 py-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 transition-colors ${
                      item.active ? 'bg-blue-50/50' : 'hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`px-2 py-1 rounded-md font-mono tabular-nums text-xs shrink-0 border ${
                          item.active
                            ? 'bg-blue-700 text-white border-blue-700'
                            : 'bg-stone-100 text-stone-700 border-stone-200'
                        }`}
                      >
                        {item.time}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-stone-900 truncate">{item.name}</div>
                        <div className="text-[11px] text-stone-500 truncate">
                          {item.service} · {item.staff}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-mono tabular-nums font-medium text-stone-900">
                        {item.price}
                      </span>
                      <span className="text-[11px] text-stone-500">{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === 'mobile' ? (
          <div className="p-4 sm:p-8 bg-[#fafaf8]">
            <div className="max-w-md mx-auto rounded-2xl border border-stone-900/10 bg-white p-5 text-left space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-900/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-stone-900 text-white font-medium text-sm flex items-center justify-center">
                    SD
                  </div>
                  <div>
                    <div className="text-sm font-medium text-stone-900">Studio Demir</div>
                    <div className="text-[11px] text-stone-500">Üyeliksiz randevu ekranı</div>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-emerald-700">Açık</span>
              </div>

              <div>
                <div className="text-xs font-medium text-stone-500 mb-2">1. Hizmet seçimi</div>
                <div className="p-3 rounded-xl border border-blue-700 bg-blue-50/40 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-stone-900">Saç kesimi ve bakım</div>
                    <div className="text-[11px] text-stone-500 flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3.5 h-3.5" strokeWidth={1.5} /> 45 dk · Melih Usta
                    </div>
                  </div>
                  <span className="text-xs font-mono tabular-nums font-semibold text-blue-700">450 ₺</span>
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-stone-500 mb-2">2. Müsait saat</div>
                <div className="grid grid-cols-4 gap-2">
                  {['13:30', '14:30', '15:45', '17:00'].map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-2 rounded-lg text-xs font-mono tabular-nums border transition-colors ${
                        selectedSlot === slot
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs bg-stone-100 border border-stone-200 rounded-xl p-3 text-stone-800">
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-700 shrink-0" strokeWidth={1.75} />
                  Seçilen saat: <span className="font-mono font-semibold">{selectedSlot}</span>
                </span>
                <span className="text-[11px] text-stone-500">Çakışma yok</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-8 bg-[#fafaf8]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="rounded-xl border border-stone-900/10 bg-white p-5 flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl bg-stone-900 p-3 shrink-0 flex items-center justify-center">
                  <QrCode className="w-full h-full text-white" strokeWidth={1.5} />
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="text-[11px] font-mono text-stone-500">Vitrin QR afişi</div>
                  <h4 className="text-sm font-medium text-stone-900">Kamerayı okut, anında sıra al</h4>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    İşletmenize özel QR kod tek tıkla A4 afiş olarak indirilir; camınıza veya masanıza koyabilirsiniz.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-stone-900/10 bg-white p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-xs font-medium text-stone-900">
                    <MessageSquare className="w-4 h-4 text-stone-500" strokeWidth={1.5} />
                    Tek tıkla WhatsApp onayı
                  </span>
                  <span className="text-[11px] font-mono text-stone-500">Hazır şablon</span>
                </div>
                <div className="rounded-xl bg-[#fafaf8] border border-stone-900/10 p-3.5 text-xs text-stone-700 leading-relaxed">
                  Merhaba <span className="font-medium text-stone-900">Caner Bey</span>, bugün saat{' '}
                  <span className="font-mono font-medium text-blue-700">14:30</span> randevunuz onaylanmıştır.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
