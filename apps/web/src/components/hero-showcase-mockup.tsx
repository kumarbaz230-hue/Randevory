'use client';

import React, { useState } from 'react';
import { Calendar, Check, Clock, MessageSquare, QrCode, Smartphone } from 'lucide-react';
import { RevenueFlowCanvas } from './revenue-flow-canvas';

type ShowcaseTab = 'dashboard' | 'mobile' | 'automation';

/**
 * Sıcak stüdyo temalı RANDEVORY ürün önizleme penceresi.
 * Ağır blur efektleri olmadan mobilde akıcı çalışır.
 */
export function HeroShowcaseMockup() {
  const [activeTab, setActiveTab] = useState<ShowcaseTab>('dashboard');
  const [selectedSlot, setSelectedSlot] = useState('14:30');

  return (
    <div className="mt-12 sm:mt-16">
      {/* Warm Tab Switcher */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="inline-flex flex-wrap gap-1 p-1 rounded-xl bg-[#EFE9DD] border border-[#171310]/10">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'dashboard'
                ? 'bg-[#171310] text-[#FBF8F3]'
                : 'text-[#575049] hover:text-[#171310]'
            }`}
          >
            <Calendar className="w-4 h-4" strokeWidth={1.6} />
            İşletme paneli
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mobile')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'mobile'
                ? 'bg-[#171310] text-[#FBF8F3]'
                : 'text-[#575049] hover:text-[#171310]'
            }`}
          >
            <Smartphone className="w-4 h-4" strokeWidth={1.6} />
            Müşteri ekranı
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('automation')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'automation'
                ? 'bg-[#171310] text-[#FBF8F3]'
                : 'text-[#575049] hover:text-[#171310]'
            }`}
          >
            <QrCode className="w-4 h-4" strokeWidth={1.6} />
            QR ve WhatsApp
          </button>
        </div>

        <span className="hidden sm:inline-block text-xs font-mono text-[#7C7267]">
          Canlı ürün önizlemesi · Sekmelere tıklayarak inceleyin
        </span>
      </div>

      {/* Product Window */}
      <div className="rounded-2xl border border-[#171310]/12 bg-white shadow-[0_24px_60px_-20px_rgba(23,19,16,0.14)] overflow-hidden">
        {/* Window Chrome */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-[#F6F1E7] border-b border-[#171310]/10">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D9CFC0]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#D9CFC0]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#D9CFC0]" />
          </div>
          <div className="px-3 py-1 rounded-md bg-white border border-[#171310]/10 text-[11px] font-mono text-[#575049] truncate max-w-[200px] sm:max-w-xs">
            {activeTab === 'dashboard'
              ? 'randevory.com/dashboard/calendar'
              : activeTab === 'mobile'
              ? 'randevory.com/studio-demir'
              : 'randevory.com/qr-vitrin'}
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-[#15803D]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
            Aktif
          </div>
        </div>

        {activeTab === 'dashboard' ? (
          <div className="p-4 sm:p-6 text-left space-y-4">
            {/* Compact Stat Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-[#FBF8F3] border border-[#171310]/10">
                <div className="text-xs text-[#6E655C]">Bugünkü randevu</div>
                <div className="mt-1 text-2xl font-semibold font-mono tabular-nums text-[#171310]">18</div>
                <div className="text-[11px] text-[#15803D] font-medium mt-1 tabular-nums">+4 düne göre</div>
              </div>

              <div className="p-4 rounded-xl bg-[#FBF8F3] border border-[#171310]/10">
                <div className="text-xs text-[#6E655C]">Günlük ciro</div>
                <div className="mt-1 text-2xl font-semibold font-mono tabular-nums text-[#171310]">9.450 ₺</div>
                <div className="text-[11px] text-[#6E655C] mt-1">Tamamlanan işlemler</div>
              </div>

              <div className="p-4 rounded-xl bg-[#FBF8F3] border border-[#171310]/10">
                <div className="text-xs text-[#6E655C]">Çakışma kilidi</div>
                <div className="mt-1 text-2xl font-semibold font-mono tabular-nums text-[#171310]">%0 risk</div>
                <div className="text-[11px] text-[#6E655C] mt-1">GIST veritabanı koruması</div>
              </div>

              <div className="p-4 rounded-xl bg-[#FDF4EF] border border-[#B84A24]/25">
                <div className="text-xs text-[#8F3A1C]">Doluluk oranı</div>
                <div className="mt-1 text-2xl font-semibold font-mono tabular-nums text-[#B84A24]">%92</div>
                <div className="text-[11px] text-[#8F3A1C] mt-1 tabular-nums">16 / 18 saat dolu</div>
              </div>
            </div>

            {/* Main Chart + Schedule Table */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-5">
                <RevenueFlowCanvas />
              </div>

              <div className="lg:col-span-7 rounded-xl border border-[#171310]/10 bg-white divide-y divide-[#171310]/8">
                <div className="px-4 py-3 flex items-center justify-between bg-[#FBF8F3] rounded-t-xl">
                  <span className="text-xs font-semibold text-[#171310]">Bugünün akıllı takvimi</span>
                  <span className="text-[11px] font-mono text-[#6E655C]">Otomatik sıralı</span>
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
                      item.active ? 'bg-[#FDF4EF]' : 'hover:bg-[#FBF8F3]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`px-2 py-1 rounded-md font-mono tabular-nums text-xs shrink-0 border ${
                          item.active
                            ? 'bg-[#B84A24] text-white border-[#B84A24]'
                            : 'bg-[#F3EDE2] text-[#171310] border-[#171310]/10'
                        }`}
                      >
                        {item.time}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[#171310] truncate">{item.name}</div>
                        <div className="text-[11px] text-[#6E655C] truncate">
                          {item.service} · {item.staff}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-mono tabular-nums font-semibold text-[#171310]">
                        {item.price}
                      </span>
                      <span className="text-[11px] text-[#6E655C]">{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === 'mobile' ? (
          <div className="p-4 sm:p-8 bg-[#FBF8F3]">
            <div className="max-w-md mx-auto rounded-2xl border border-[#171310]/10 bg-white p-5 text-left space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#171310]/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#171310] text-[#FBF8F3] font-semibold text-sm flex items-center justify-center">
                    SD
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#171310]">Studio Demir</div>
                    <div className="text-[11px] text-[#6E655C]">Üyeliksiz 30 sn&apos;de randevu</div>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-[#15803D] font-semibold">Açık</span>
              </div>

              <div>
                <div className="text-xs font-medium text-[#6E655C] mb-2">1. Hizmet seçimi</div>
                <div className="p-3 rounded-xl border border-[#B84A24] bg-[#FDF4EF] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-[#171310]">Saç kesimi ve bakım</div>
                    <div className="text-[11px] text-[#6E655C] flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3.5 h-3.5" strokeWidth={1.6} /> 45 dk · Melih Usta
                    </div>
                  </div>
                  <span className="text-xs font-mono tabular-nums font-semibold text-[#B84A24]">450 ₺</span>
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-[#6E655C] mb-2">2. Müsait saat seçin</div>
                <div className="grid grid-cols-4 gap-2">
                  {['13:30', '14:30', '15:45', '17:00'].map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-2 rounded-lg text-xs font-mono tabular-nums border transition-colors ${
                        selectedSlot === slot
                          ? 'bg-[#171310] text-white border-[#171310]'
                          : 'bg-white text-[#171310] border-[#171310]/15 hover:border-[#B84A24]'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs bg-[#F3EDE2] border border-[#171310]/10 rounded-xl p-3 text-[#171310]">
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#15803D] shrink-0" strokeWidth={1.75} />
                  Seçilen saat: <span className="font-mono font-semibold">{selectedSlot}</span>
                </span>
                <span className="text-[11px] text-[#6E655C]">Çakışma yok</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-8 bg-[#FBF8F3]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="rounded-xl border border-[#171310]/10 bg-white p-5 flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl bg-[#171310] p-3 shrink-0 flex items-center justify-center">
                  <QrCode className="w-full h-full text-[#FBF8F3]" strokeWidth={1.6} />
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="text-[11px] font-mono text-[#B84A24]">Vitrin QR afişi</div>
                  <h4 className="text-sm font-semibold text-[#171310]">Kamerayı okut, anında sıra al</h4>
                  <p className="text-xs text-[#6E655C] leading-relaxed">
                    İşletmenize özel QR kod tek tıkla A4 afiş olarak indirilir; camınıza veya masanıza koyabilirsiniz.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-[#171310]/10 bg-white p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#171310]">
                    <MessageSquare className="w-4 h-4 text-[#15803D]" strokeWidth={1.6} />
                    Tek tıkla WhatsApp onayı
                  </span>
                  <span className="text-[11px] font-mono text-[#6E655C]">Hazır şablon</span>
                </div>
                <div className="rounded-xl bg-[#FBF8F3] border border-[#171310]/10 p-3.5 text-xs text-[#3D3731] leading-relaxed">
                  Merhaba <span className="font-semibold text-[#171310]">Caner Bey</span>, bugün saat{' '}
                  <span className="font-mono font-semibold text-[#B84A24]">14:30</span> randevunuz onaylanmıştır.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
