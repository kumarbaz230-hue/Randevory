'use client';

import React, { useState, useEffect } from 'react';
import { store } from '@/lib/data-store';
import { repo } from '@/lib/supabase-repository';
import { Business, WorkingHour, SubscriptionTier } from '@/types';
import {
  Settings,
  Clock,
  Building,
  CreditCard,
  CheckCircle2,
  ExternalLink,
  Save,
  Check,
} from 'lucide-react';

export default function DashboardSettingsPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [savedMessage, setSavedMessage] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [slotInterval, setSlotInterval] = useState(30);
  const [autoConfirm, setAutoConfirm] = useState(true);
  const [cancelHours, setCancelHours] = useState(2);

  const daysTurkish = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

  useEffect(() => {
    const load = async () => {
      const b = await repo.getActiveBusiness();
      if (b) {
        setBusiness(b);
        setName(b.name);
        setSlug(b.slug);
        setPhone(b.phone);
        setEmail(b.email);
        setAddress(b.address);
        setSlotInterval(b.settings.slot_interval_minutes);
        setAutoConfirm(b.settings.auto_confirm_appointments);
        setCancelHours(b.settings.cancellation_deadline_hours);
        const wh = await repo.getWorkingHours(b.id);
        setWorkingHours(wh);
      }
    };
    load();
  }, []);

  const handleWorkingHourToggle = (dayIndex: number) => {
    setWorkingHours((prev) =>
      prev.map((wh) =>
        wh.day_of_week === dayIndex ? { ...wh, is_open: !wh.is_open } : wh
      )
    );
  };

  const handleWorkingHourChange = (
    dayIndex: number,
    field: 'open_time' | 'close_time',
    val: string
  ) => {
    setWorkingHours((prev) =>
      prev.map((wh) =>
        wh.day_of_week === dayIndex ? { ...wh, [field]: val } : wh
      )
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;

    await repo.updateBusiness(business.id, {
      name,
      slug,
      phone,
      email,
      address,
      settings: {
        ...business.settings,
        slot_interval_minutes: Number(slotInterval),
        auto_confirm_appointments: autoConfirm,
        cancellation_deadline_hours: Number(cancelHours),
      },
    });

    await repo.updateWorkingHours(business.id, workingHours);

    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">İşletme ve Randevu Ayarları</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            İşletme profilinizi, çalışma saatlerinizi ve abonelik paketinizi bu ekrandan yönetin.
          </p>
        </div>

        {savedMessage && (
          <div className="px-3.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in">
            <Check className="w-4 h-4" /> Değişiklikler kaydedildi!
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Profile and General Info */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building className="w-4 h-4 text-brand-600" />
            İşletme Bilgileri
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">İşletme Adı</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Özel Bağlantı Kodu (Slug)</label>
              <div className="flex items-center">
                <span className="px-3 py-2 rounded-l-xl border border-r-0 border-slate-300 bg-slate-50 text-slate-500 font-mono">
                  randevory.com/
                </span>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-3 py-2 rounded-r-xl border border-slate-300 font-mono focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Telefon Numarası</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">E-posta</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Adres</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Booking Rules & Slots */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-600" />
            Randevu Kuralları
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Slot Adım Aralığı</label>
              <select
                value={slotInterval}
                onChange={(e) => setSlotInterval(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
              >
                <option value={15}>15 Dakika</option>
                <option value={30}>30 Dakika (Önerilen)</option>
                <option value={45}>45 Dakika</option>
                <option value={60}>60 Dakika (1 Saat)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">İptal Süre Kuralı</label>
              <select
                value={cancelHours}
                onChange={(e) => setCancelHours(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
              >
                <option value={1}>1 saat öncesine kadar</option>
                <option value={2}>2 saat öncesine kadar</option>
                <option value={4}>4 saat öncesine kadar</option>
                <option value={24}>24 saat öncesine kadar</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Otomatik Onaylama</label>
              <select
                value={autoConfirm ? 'yes' : 'no'}
                onChange={(e) => setAutoConfirm(e.target.value === 'yes')}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
              >
                <option value="yes">Evet (Müşteri randevuları anında onaylanır)</option>
                <option value="no">Hayır (Manuel işletme onayı gereksin)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Weekly Working Hours */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-600" />
            Haftalık Çalışma ve Mesai Saatleri
          </h2>

          <div className="divide-y divide-slate-100 text-xs">
            {workingHours.map((wh) => (
              <div key={wh.day_of_week} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-3 w-32">
                  <input
                    type="checkbox"
                    checked={wh.is_open}
                    onChange={() => handleWorkingHourToggle(wh.day_of_week)}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span className={`font-semibold ${wh.is_open ? 'text-slate-900' : 'text-slate-400'}`}>
                    {daysTurkish[wh.day_of_week]}
                  </span>
                </div>

                {wh.is_open ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={wh.open_time}
                      onChange={(e) =>
                        handleWorkingHourChange(wh.day_of_week, 'open_time', e.target.value)
                      }
                      className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs"
                    />
                    <span className="text-slate-400">-</span>
                    <input
                      type="time"
                      value={wh.close_time}
                      onChange={(e) =>
                        handleWorkingHourChange(wh.day_of_week, 'close_time', e.target.value)
                      }
                      className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                ) : (
                  <span className="text-slate-400 italic">Kapalı</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Subscription Plan Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-brand-600" />
            Abonelik Paketi
          </h2>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-base">Profesyonel Paket</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                  Aktif
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                10 Personel, Sınırsız Randevu, SMS & E-posta Hatırlatma, Finans Raporları
              </p>
            </div>
            <div className="text-right">
              <span className="text-xl font-extrabold text-slate-900">799 ₺</span>
              <span className="text-xs text-slate-500"> / ay</span>
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-brand-600 text-white font-semibold text-xs hover:bg-brand-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Save className="w-4 h-4" /> Tüm Değişiklikleri Kaydet
          </button>
        </div>
      </form>
    </div>
  );
}
