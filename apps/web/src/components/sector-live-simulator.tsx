'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Calendar,
  Check,
  Clock,
  GraduationCap,
  HeartPulse,
  Laptop,
  Scissors,
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
    brandName: 'Studio Demir',
    initials: 'SD',
    services: [
      { title: 'Saç kesimi ve şekillendirme', duration: '45 dk', price: '450 ₺' },
      { title: 'Sakal tasarımı ve buhar', duration: '30 dk', price: '250 ₺' },
      { title: 'Cilt bakımı ve maske', duration: '40 dk', price: '500 ₺' },
    ],
    staff: 'Melih Usta · Uzman Berber',
    slots: ['11:00', '13:30', '15:15', '17:45'],
    highlight: 'Instagram linkinden ve vitrin QR afişinden 7/24 randevu akışı',
  },
  {
    id: 'kafe',
    name: 'Kafe & Restoranlar',
    shortDesc: 'Masa ve loca rezervasyonu',
    slug: 'randevory.com/luna-bistro',
    brandName: 'Luna Bistro',
    initials: 'LB',
    services: [
      { title: 'Teras 4 kişilik masa', duration: '120 dk', price: 'Ücretsiz' },
      { title: 'Loca rezervasyonu', duration: '180 dk', price: 'Ön onaylı' },
      { title: 'Özel masa düzeni', duration: '150 dk', price: '750 ₺' },
    ],
    staff: 'Teras ve salon masa yönetimi',
    slots: ['18:30', '19:30', '20:30', '21:30'],
    highlight: 'Akşam yoğunluğu tek ekranda planlanır, masa çakışması olmaz',
  },
  {
    id: 'oto',
    name: 'Oto Bakım & Detailing',
    shortDesc: 'Periyodik bakım ve yıkama',
    slug: 'randevory.com/apex-detailing',
    brandName: 'Apex Garage',
    initials: 'AG',
    services: [
      { title: 'Seramik kaplama ve pasta cila', duration: '240 dk', price: '6.500 ₺' },
      { title: 'Detaylı iç ve dış temizlik', duration: '90 dk', price: '1.200 ₺' },
      { title: 'Motor koruma bakımı', duration: '45 dk', price: '750 ₺' },
    ],
    staff: '1. Peron · Baş Usta Ekibi',
    slots: ['09:00', '11:30', '14:00', '16:30'],
    highlight: 'Peron ve lift dolulukları çakışmadan araç kabulü yapılır',
  },
  {
    id: 'egitim',
    name: 'Özel Ders & Eğitim',
    shortDesc: 'Birebir ders ve seans',
    slug: 'randevory.com/akademi-plus',
    brandName: 'Akademi Plus',
    initials: 'AP',
    services: [
      { title: 'Birebir matematik etüdü', duration: '60 dk', price: '850 ₺' },
      { title: 'İngilizce konuşma pratiği', duration: '50 dk', price: '700 ₺' },
      { title: 'Sınav koçluğu seansı', duration: '45 dk', price: '600 ₺' },
    ],
    staff: 'Zeynep Hoca · Kıdemli Eğitmen',
    slots: ['15:00', '16:30', '18:00', '19:30'],
    highlight: 'Öğrenciler uygun ders saatini doğrudan kendisi seçer',
  },
  {
    id: 'veteriner',
    name: 'Veteriner Klinikleri',
    shortDesc: 'Muayene ve aşı takvimi',
    slug: 'randevory.com/pativet-klinik',
    brandName: 'PatiVet Klinik',
    initials: 'PV',
    services: [
      { title: 'Genel muayene ve kontrol', duration: '30 dk', price: '650 ₺' },
      { title: 'Karma aşı uygulaması', duration: '20 dk', price: '900 ₺' },
      { title: 'Pet kuaför ve bakım', duration: '60 dk', price: '800 ₺' },
    ],
    staff: 'Vet. Hek. Burak Bey',
    slots: ['10:00', '11:30', '14:00', '16:00'],
    highlight: 'Bekleme alanında yığılma olmadan düzenli muayene akışı',
  },
  {
    id: 'teknik',
    name: 'Teknik Servisler',
    shortDesc: 'Cihaz onarım ve teslim',
    slug: 'randevory.com/hizli-servis',
    brandName: 'ProFix Servis',
    initials: 'PF',
    services: [
      { title: 'Ekran ve batarya değişimi', duration: '45 dk', price: '1.850 ₺' },
      { title: 'Bilgisayar termal bakım', duration: '60 dk', price: '950 ₺' },
      { title: 'Arıza tespit incelemesi', duration: '20 dk', price: 'Ücretsiz' },
    ],
    staff: 'Teknik Masa 2 · Donanım Uzmanı',
    slots: ['10:30', '12:00', '14:30', '17:00'],
    highlight: 'Müşteri cihazını randevulu saatte teslim edip beklemeksizin alır',
  },
];

const SECTOR_ICONS: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  kuafor: Scissors,
  kafe: UtensilsCrossed,
  oto: Wrench,
  egitim: GraduationCap,
  veteriner: HeartPulse,
  teknik: Laptop,
};

/**
 * Koyu espresso zemin üzerinde sıcak krem önizlemeli sektör simülatörü.
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left: Sector Selector Buttons */}
      <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3">
        {SECTOR_PRESETS.map((preset) => {
          const Icon = SECTOR_ICONS[preset.id] || Calendar;
          const isSelected = preset.id === active.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectSector(preset)}
              className={`text-left p-4 rounded-xl border transition-colors flex flex-col gap-3 ${
                isSelected
                  ? 'bg-[#B84A24] text-white border-[#B84A24]'
                  : 'bg-white/[0.05] text-[#FBF8F3] border-white/10 hover:border-white/25'
              }`}
            >
              <Icon
                className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-[#D6C7B2]'}`}
                strokeWidth={1.6}
              />
              <div>
                <div className="font-semibold text-xs sm:text-sm leading-snug">{preset.name}</div>
                <div className={`text-[11px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-[#A89E92]'}`}>
                  {preset.shortDesc}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Right: Warm Ivory Preview Card */}
      <div className="lg:col-span-7 rounded-2xl border border-white/15 bg-[#FBF8F3] text-[#171310] overflow-hidden shadow-2xl">
        <div className="px-5 py-3 bg-[#F3EDE2] border-b border-[#171310]/10 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-mono text-[#575049] truncate">{active.slug}</span>
          <span className="text-[11px] font-mono text-[#B84A24] font-semibold">Canlı önizleme</span>
        </div>

        <div className="p-5 sm:p-6 space-y-5 text-left">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#171310] text-[#FBF8F3] font-semibold text-sm flex items-center justify-center shrink-0">
                {active.initials}
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#171310]">{active.brandName}</h3>
                <p className="text-xs text-[#6E655C]">{active.staff}</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#15803D]">
              <Check className="w-4 h-4" strokeWidth={1.75} />
              7/24 randevu açık
            </span>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-[#6E655C]">Hizmet ve seans listesi</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {active.services.map((srv, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border transition-colors ${
                    idx === 0
                      ? 'border-[#B84A24] bg-[#FDF4EF]'
                      : 'border-[#171310]/10 bg-white'
                  }`}
                >
                  <div className="text-xs font-semibold text-[#171310] leading-snug">{srv.title}</div>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-[#6E655C] inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" strokeWidth={1.6} /> {srv.duration}
                    </span>
                    <span className="font-mono tabular-nums font-semibold text-[#171310]">{srv.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-[#6E655C] mb-2">Müşterinin seçtiği saat</div>
            <div className="grid grid-cols-4 gap-2">
              {active.slots.map((slot) => (
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

          <div className="pt-4 border-t border-[#171310]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-[#575049]">
              <Calendar className="w-4 h-4 text-[#B84A24] shrink-0" strokeWidth={1.6} />
              <span>{active.highlight}</span>
            </div>
            <Link
              href="/register"
              className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#B84A24] text-white text-xs font-semibold hover:bg-[#9E3D1C] transition-colors"
            >
              Bu sektörle başla <ArrowRight className="w-4 h-4" strokeWidth={1.6} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
