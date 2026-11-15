'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  GraduationCap,
  HeartPulse,
  Laptop,
  Scissors,
  Sparkles,
  UtensilsCrossed,
  Wrench,
} from 'lucide-react';

interface SectorPreset {
  id: string;
  name: string;
  shortDesc: string;
  slug: string;
  brandName: string;
  initials: string;
  accent: string;
  services: { title: string; duration: string; price: string }[];
  staff: string;
  slots: string[];
  highlight: string;
}

const SECTOR_PRESETS: SectorPreset[] = [
  {
    id: 'kuafor',
    name: 'Kuaför & Berberler',
    shortDesc: 'Saç, sakal ve bakım',
    slug: 'randevory.com/studio-demir',
    brandName: 'Studio Demir Hair & Care',
    initials: 'SD',
    accent: 'from-blue-600 to-indigo-600',
    services: [
      { title: 'Saç Kesimi & Şekillendirme', duration: '45 dk', price: '450 ₺' },
      { title: 'Sakal Tasarımı & Buhar', duration: '30 dk', price: '250 ₺' },
      { title: 'Cilt Bakımı & Maske', duration: '40 dk', price: '500 ₺' },
    ],
    staff: 'Melih Usta • Uzman Berber',
    slots: ['11:00', '13:30', '15:15', '17:45'],
    highlight: 'Instagram linkinden ve camdaki QR afişten 7/24 randevu akışı',
  },
  {
    id: 'kafe',
    name: 'Kafe & Restoranlar',
    shortDesc: 'Masa ve loca rezervasyonu',
    slug: 'randevory.com/luna-bistro',
    brandName: 'Luna Bistro & Terrace',
    initials: 'LB',
    accent: 'from-amber-500 to-orange-600',
    services: [
      { title: 'Teras 4 Kişilik Masa', duration: '120 dk', price: 'Ücretsiz' },
      { title: 'VIP Loca Rezervasyonu', duration: '180 dk', price: 'Kapora Opsiyonlu' },
      { title: 'Doğum Günü Masa Düzeni', duration: '150 dk', price: '750 ₺' },
    ],
    staff: 'Teras & Salon Masa Yönetimi',
    slots: ['18:30', '19:30', '20:30', '21:30'],
    highlight: 'Boş masa kalmasın, akşam yoğunluğu tek ekranda planlansın',
  },
  {
    id: 'oto',
    name: 'Oto Bakım & Detailing',
    shortDesc: 'Periyodik bakım ve yıkama',
    slug: 'randevory.com/apex-detailing',
    brandName: 'Apex Garage Detailing',
    initials: 'AG',
    accent: 'from-emerald-600 to-teal-600',
    services: [
      { title: 'Seramik Kaplama & Pasta Cila', duration: '240 dk', price: '6.500 ₺' },
      { title: 'Detaylı İç & Dış Temizlik', duration: '90 dk', price: '1.200 ₺' },
      { title: 'Motor Koruma Bakımı', duration: '45 dk', price: '750 ₺' },
    ],
    staff: '1. Peron • Baş Usta Ekibi',
    slots: ['09:00', '11:30', '14:00', '16:30'],
    highlight: 'Peron ve lift dolulukları çakışmadan araç kabulü',
  },
  {
    id: 'egitim',
    name: 'Özel Ders & Eğitim',
    shortDesc: 'Birebir ders ve seans',
    slug: 'randevory.com/akademi-plus',
    brandName: 'Akademi Plus Koçluk',
    initials: 'AP',
    accent: 'from-purple-600 to-violet-600',
    services: [
      { title: 'Birebir Matematik Etüdü', duration: '60 dk', price: '850 ₺' },
      { title: 'İngilizce Konuşma Pratiği', duration: '50 dk', price: '700 ₺' },
      { title: 'Sınav Koçluğu Seansı', duration: '45 dk', price: '600 ₺' },
    ],
    staff: 'Zeynep Hoca • Kıdemli Eğitmen',
    slots: ['15:00', '16:30', '18:00', '19:30'],
    highlight: 'Öğrenci ve veliler uygun ders saatini kendisi seçsin',
  },
  {
    id: 'veteriner',
    name: 'Veteriner Klinikleri',
    shortDesc: 'Muayene ve aşı takvimi',
    slug: 'randevory.com/pativet-klinik',
    brandName: 'PatiVet Veteriner Kliniği',
    initials: 'PV',
    accent: 'from-rose-500 to-pink-600',
    services: [
      { title: 'Genel Muayene & Kontrol', duration: '30 dk', price: '650 ₺' },
      { title: 'Karma Aşı Uygulaması', duration: '20 dk', price: '900 ₺' },
      { title: 'Pet Kuaför & Tırnak Bakımı', duration: '60 dk', price: '800 ₺' },
    ],
    staff: 'Vet. Hek. Burak Bey',
    slots: ['10:00', '11:30', '14:00', '16:00'],
    highlight: 'Klinik bekleme alanında yığılma olmadan düzenli muayene akışı',
  },
  {
    id: 'teknik',
    name: 'Teknik Servisler',
    shortDesc: 'Cihaz onarım ve teslim',
    slug: 'randevory.com/hizli-servis',
    brandName: 'ProFix Teknik Servis',
    initials: 'PF',
    accent: 'from-cyan-600 to-blue-600',
    services: [
      { title: 'Ekran & Batarya Değişimi', duration: '45 dk', price: '1.850 ₺' },
      { title: 'Laptop Termal Macun & Bakım', duration: '60 dk', price: '950 ₺' },
      { title: 'Arıza Tespit & Ön İnceleme', duration: '20 dk', price: 'Ücretsiz' },
    ],
    staff: 'Teknik Masa 2 • Donanım Uzmanı',
    slots: ['10:30', '12:00', '14:30', '17:00'],
    highlight: 'Müşteri cihazını randevulu saatte teslim edip beklemeksizin alsın',
  },
];

const SECTOR_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  kuafor: Scissors,
  kafe: UtensilsCrossed,
  oto: Wrench,
  egitim: GraduationCap,
  veteriner: HeartPulse,
  teknik: Laptop,
};

/**
 * Ziyaretçinin kendi sektörünü seçip RANDEVORY'de işletmesinin
 * nasıl görüneceğini canlı olarak deneyimlemesini sağlayan interaktif simülatör.
 */
export function SectorLiveSimulator() {
  const [selectedId, setSelectedId] = useState<string>('kuafor');
  const [selectedSlot, setSelectedSlot] = useState<string>(SECTOR_PRESETS[0].slots[1]);

  const active = SECTOR_PRESETS.find((s) => s.id === selectedId) || SECTOR_PRESETS[0];

  const handleSelectSector = (preset: SectorPreset) => {
    setSelectedId(preset.id);
    setSelectedSlot(preset.slots[1] || preset.slots[0]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
      {/* Left: Sector Selector Buttons */}
      <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3">
        {SECTOR_PRESETS.map((preset) => {
          const Icon = SECTOR_ICONS[preset.id] || Sparkles;
          const isSelected = preset.id === active.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectSector(preset)}
              className={`text-left p-4 rounded-2xl border transition-all flex flex-col gap-2.5 ${
                isSelected
                  ? 'bg-slate-950 text-white border-slate-900 shadow-xl shadow-slate-900/15 -translate-y-0.5'
                  : 'bg-white text-slate-900 border-slate-200 hover:border-brand-400 hover:shadow-md'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isSelected
                    ? `bg-gradient-to-br ${preset.accent} text-white shadow-sm`
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm leading-snug">{preset.name}</div>
                <div className={`text-[11px] mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                  {preset.shortDesc}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Right: Live Interactive Preview Card for Selected Sector */}
      <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_-15px_rgba(15,23,42,0.12)] overflow-hidden">
        {/* Top Bar */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="truncate">{active.slug}</span>
          </div>
          <span className="text-[11px] font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
            Canlı Sektör Önizlemesi
          </span>
        </div>

        <div className="p-5 sm:p-7 space-y-5 text-left">
          {/* Business Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${active.accent} text-white font-extrabold text-base flex items-center justify-center shadow-md shrink-0`}
              >
                {active.initials}
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900">{active.brandName}</h3>
                <p className="text-xs text-slate-500">{active.staff}</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              7/24 Randevu Açık
            </span>
          </div>

          {/* Services List */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Hizmet &amp; Seans Listesi
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {active.services.map((srv, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border transition-all ${
                    idx === 0
                      ? 'border-brand-500 bg-brand-50/40'
                      : 'border-slate-200 bg-slate-50/60'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-900 leading-snug">{srv.title}</div>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {srv.duration}
                    </span>
                    <span className="font-extrabold text-slate-900">{srv.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Time Slots */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Müşterinin Seçtiği Saat
            </div>
            <div className="grid grid-cols-4 gap-2">
              {active.slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    selectedSlot === slot
                      ? 'bg-slate-950 text-white border-slate-950 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-brand-400'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Highlight + CTA */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Calendar className="w-4 h-4 text-brand-600 shrink-0" />
              <span>{active.highlight}</span>
            </div>
            <Link
              href="/register"
              className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition-colors"
            >
              Bu Sektörle Başla <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
