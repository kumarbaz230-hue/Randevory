'use client';

import React, { useState, useMemo } from 'react';
import {
  Business,
  Appointment,
  RestaurantTable,
} from '@/types';
import {
  DEFAULT_TABLE_SECTIONS,
  getBusinessTables,
} from '@/lib/table-helper';
import { repo } from '@/lib/supabase-repository';
import {
  Users,
  Calendar as CalendarIcon,
  Clock,
  Check,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  MapPin,
  Utensils,
} from 'lucide-react';

interface TableBookingFlowProps {
  business: Business;
  appointments: Appointment[];
  customerPhone?: string;
  onAppointmentCreated?: (apt: Appointment) => void;
}

const MEAL_SLOTS = [
  { group: '🌞 Öğle Servisi', times: ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30'] },
  { group: '☕ Akşamüstü & Çay/Kahve', times: ['15:00', '15:30', '16:00', '16:30', '17:00', '17:30'] },
  { group: '🌙 Akşam Yemeği', times: ['18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'] },
];

export function TableBookingFlow({
  business,
  appointments,
  customerPhone: initialPhone = '',
  onAppointmentCreated,
}: TableBookingFlowProps) {
  const tables = useMemo(() => getBusinessTables(business), [business]);

  // Steps: 1: Table & Guests, 2: Date & Time, 3: Contact & Notes, 4: Confirmed
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Selections
  const [guestCount, setGuestCount] = useState<number>(2);
  const [activeSection, setActiveSection] = useState<string>('all');
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);

  // Date & Time
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [selectedTime, setSelectedTime] = useState<string>('19:30');

  // Contact
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState(initialPhone);
  const [customerEmail, setCustomerEmail] = useState('');
  const [specialRequest, setSpecialRequest] = useState('');
  const [consent, setConsent] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [createdApt, setCreatedApt] = useState<Appointment | null>(null);
  // OTP Verification State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState('');

  // Filter tables by section and capacity
  const filteredTables = useMemo(() => {
    return tables.filter((t) => {
      if (activeSection !== 'all' && t.section !== activeSection) return false;
      return true;
    });
  }, [tables, activeSection]);

  // Next 7 days for date picker
  const upcomingDays = useMemo(() => {
    const list = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      list.push(d);
    }
    return list;
  }, []);

  const isToday = (d: Date) => {
    const now = new Date();
    return d.toDateString() === now.toDateString();
  };

  const isTomorrow = (d: Date) => {
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    return d.toDateString() === tom.toDateString();
  };

  const getDayName = (d: Date) => {
    if (isToday(d)) return 'Bugün';
    if (isTomorrow(d)) return 'Yarın';
    return d.toLocaleDateString('tr-TR', { weekday: 'short' });
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable || !customerName.trim() || !customerPhone.trim()) {
      setErrorMessage('Lütfen ad soyad ve telefon numaranızı girin.');
      return;
    }

    if (!consent) {
      setErrorMessage('Lütfen KVKK bilgilendirmesini ve rezervasyon koşullarını onaylayın.');
      return;
    }

    // 1. Blacklist / Kara Liste Koruması
    const cleanPhone = repo.normalizePhone(customerPhone);
    const blacklist = (business.settings?.blacklist_phones || []).map((p) => repo.normalizePhone(p));
    if (blacklist.includes(cleanPhone)) {
      setErrorMessage(
        'Bu telefon numarası işletme tarafından masa rezervasyonuna kapatılmıştır. Bilgi için lütfen işletmeyle iletişime geçin.'
      );
      return;
    }

    // 2. Spam / Günlük Randevu Limiti
    const maxDaily = business.settings?.max_daily_bookings_per_phone ?? 2;
    const dateKey = selectedDate.toISOString().split('T')[0];
    const sameDayCount = appointments.filter(
      (a) =>
        repo.normalizePhone(a.customer_phone) === cleanPhone &&
        (a.status === 'confirmed' || a.status === 'pending') &&
        a.start_time.startsWith(dateKey)
    ).length;

    if (sameDayCount >= maxDaily) {
      setErrorMessage(
        `Aynı gün içerisinde en fazla ${maxDaily} aktif rezervasyon oluşturabilirsiniz (Spam koruması).`
      );
      return;
    }

    // 3. Güvenlik Doğrulama Kodu (OTP)
    if (business.settings?.require_otp_verification !== false) {
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedOtp(code);
      setEnteredOtp('');
      setOtpError('');
      setShowOtpModal(true);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // Calculate start & end ISO strings
      const [h, m] = selectedTime.split(':').map(Number);
      const start = new Date(selectedDate);
      start.setHours(h, m, 0, 0);

      // Default reservation duration: 90 minutes
      const end = new Date(start.getTime() + 90 * 60 * 1000);

      const tableNotes = `[Masa Rezervasyonu: ${selectedTable.name} • ${guestCount} Kişi]${
        specialRequest.trim() ? ` Not: ${specialRequest.trim()}` : ''
      }`;

      const newApt = await repo.createAppointment({
        business_id: business.id,
        service_id: 'table-reservation',
        staff_id: 'table-host',
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim() || undefined,
        customer_notes: tableNotes,
        table_name: selectedTable.name,
        guest_count: guestCount,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        total_price: 0,
        status: business.settings?.auto_confirm_appointments === false ? 'pending' : 'confirmed',
      });

      setCreatedApt(newApt);
      setStep(4);
      if (onAppointmentCreated) {
        onAppointmentCreated(newApt);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Rezervasyon oluşturulurken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmOtpAndSubmitTable = async () => {
    if (enteredOtp.trim() !== generatedOtp.trim()) {
      setOtpError('Girdiğiniz 4 haneli kod hatalı. Lütfen kontrol edin.');
      return;
    }
    setShowOtpModal(false);
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      if (!selectedTable) return;
      const [h, m] = selectedTime.split(':').map(Number);
      const start = new Date(selectedDate);
      start.setHours(h, m, 0, 0);
      const end = new Date(start.getTime() + 90 * 60 * 1000);

      const tableNotes = `[Masa Rezervasyonu: ${selectedTable.name} • ${guestCount} Kişi]${
        specialRequest.trim() ? ` Not: ${specialRequest.trim()}` : ''
      }`;

      const newApt = await repo.createAppointment({
        business_id: business.id,
        service_id: 'table-reservation',
        staff_id: 'table-host',
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim() || undefined,
        customer_notes: tableNotes,
        table_name: selectedTable.name,
        guest_count: guestCount,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        total_price: 0,
        status: business.settings?.auto_confirm_appointments === false ? 'pending' : 'confirmed',
      });

      setCreatedApt(newApt);
      setStep(4);
      if (onAppointmentCreated) {
        onAppointmentCreated(newApt);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Rezervasyon oluşturulurken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

    // WhatsApp Message for Reservation Confirmation
  const whatsappUrl = useMemo(() => {
    if (!createdApt || !selectedTable) return '';
    const cleanPhone = (business.phone || '').replace(/[^0-9]/g, '');
    const dateFormatted = new Date(createdApt.start_time).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
    });
    const timeFormatted = selectedTime;
    const msg = `Merhaba ${business.name}, randevory.com üzerinden masa rezervasyonumu oluşturdum:\n\n🍽️ Masa: ${selectedTable.name} (${guestCount} Kişi)\n📅 Tarih: ${dateFormatted}, Saat: ${timeFormatted}\n👤 İsim: ${customerName.trim()}\n\nBilginize sunarım.`;
    return `https://wa.me/90${cleanPhone.slice(-10)}?text=${encodeURIComponent(msg)}`;
  }, [createdApt, selectedTable, business, guestCount, selectedTime, customerName]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Step Tracker */}
      {step < 4 && (
        <div className="flex items-center justify-between max-w-lg mx-auto text-xs font-semibold text-slate-500 pb-2 border-b border-slate-100">
          {[
            { n: 1, label: 'Masa & Kişi' },
            { n: 2, label: 'Tarih & Saat' },
            { n: 3, label: 'İletişim & Onay' },
          ].map((s, i) => (
            <React.Fragment key={s.n}>
              {i > 0 && <div className="flex-1 min-w-3 max-w-12 h-0.5 bg-slate-200 mx-2"></div>}
              <div className={`flex items-center gap-1.5 ${step >= s.n ? 'text-orange-600 font-bold' : ''}`}>
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${
                    step >= s.n ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {s.n}
                </span>
                <span>{s.label}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* STEP 1: GUEST COUNT & VISUAL TABLE SELECTION */}
      {step === 1 && (
        <div className="space-y-6 animate-in fade-in">
          {/* Guest Count Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-orange-600" />
              <span>1. Kaç Kişilik Masa Arıyorsunuz?</span>
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {[1, 2, 3, 4, 5, 6, 8, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setGuestCount(num)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                    guestCount === num
                      ? 'bg-orange-500 text-white border-orange-500 shadow-sm scale-[1.02]'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-orange-300'
                  }`}
                >
                  <div>{num} Kişi</div>
                  {num >= 8 && <div className="text-[9px] font-normal opacity-90">VIP / Grup</div>}
                </button>
              ))}
            </div>
          </div>

          {/* Section Filter Pills */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <Utensils className="w-4 h-4 text-orange-600" />
              <span>2. Alan / Bölüm Seçin</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_TABLE_SECTIONS.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveSection(sec.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                    activeSection === sec.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span>{sec.icon}</span>
                  <span>{sec.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Visual Table Cards Grid */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-800">3. Masanızı Seçin ({filteredTables.length} Masa):</span>
              <span className="text-[11px] text-slate-500">Masa düzenine tıklayıp seçin</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredTables.map((table) => {
                const isSelected = selectedTable?.id === table.id;
                const fits = table.capacity >= guestCount;

                return (
                  <div
                    key={table.id}
                    onClick={() => setSelectedTable(table)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50/50 shadow-md ring-2 ring-orange-400/20'
                        : 'border-slate-200 bg-white hover:border-orange-200 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${
                            isSelected ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {table.section === 'bahce' ? '🌿' : table.section === 'teras' ? '🌅' : table.section === 'vip' ? '👑' : '🛋️'}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-900">{table.name}</div>
                          <div className="text-[11px] text-slate-500">
                            {table.section === 'bahce' ? 'Bahçe Alanı' : table.section === 'teras' ? 'Teras / Manzara' : table.section === 'vip' ? 'VIP Özel Loca' : 'Ana Salon'}
                          </div>
                        </div>
                      </div>

                      {isSelected ? (
                        <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                          Müsait
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 mt-2">
                      <div className="flex items-center gap-1 text-slate-600 font-semibold">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>Maks. {table.capacity} Kişi</span>
                      </div>
                      {!fits && (
                        <span className="text-[10px] text-amber-600 font-medium">
                          {guestCount} kişi için dar olabilir
                        </span>
                      )}
                    </div>

                    {table.features && table.features.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {table.features.map((feat, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]"
                          >
                            {feat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs text-slate-600">
              {selectedTable ? (
                <span>Seçilen: <strong>{selectedTable.name}</strong> ({guestCount} Kişi)</span>
              ) : (
                <span className="text-slate-400">Devam etmek için bir masa seçin</span>
              )}
            </div>

            <button
              type="button"
              disabled={!selectedTable}
              onClick={() => setStep(2)}
              className="px-6 py-2.5 rounded-xl bg-orange-500 text-white font-bold text-xs hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm"
            >
              <span>Tarih & Saat Seç</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: DATE & TIME SELECTION */}
      {step === 2 && (
        <div className="space-y-6 animate-in fade-in">
          {/* Selected Table Summary Pill */}
          <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-xs text-orange-950">
              <span className="text-base">🍽️</span>
              <div>
                <strong>{selectedTable?.name}</strong> • {guestCount} Kişilik Masa
              </div>
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs text-orange-700 font-semibold hover:underline"
            >
              Değiştir
            </button>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <CalendarIcon className="w-4 h-4 text-orange-600" />
              <span>Rezervasyon Günü Seçin:</span>
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {upcomingDays.map((d, i) => {
                const isSelected = d.toDateString() === selectedDate.toDateString();
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedDate(d)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-orange-300'
                    }`}
                  >
                    <div className="text-[11px] font-semibold opacity-90">{getDayName(d)}</div>
                    <div className="text-sm font-extrabold">{d.getDate()}</div>
                    <div className="text-[10px] opacity-75">
                      {d.toLocaleDateString('tr-TR', { month: 'short' })}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Meal Time Slots */}
          <div className="space-y-4">
            <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-orange-600" />
              <span>Geliş Saati Seçin:</span>
            </label>

            {MEAL_SLOTS.map((slotGroup, gIdx) => (
              <div key={gIdx} className="space-y-2">
                <div className="text-xs font-bold text-slate-600">{slotGroup.group}</div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {slotGroup.times.map((timeStr) => {
                    const isSelected = selectedTime === timeStr;
                    return (
                      <button
                        key={timeStr}
                        type="button"
                        onClick={() => setSelectedTime(timeStr)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                          isSelected
                            ? 'bg-orange-500 text-white border-orange-500 shadow-xs scale-[1.02]'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-orange-300'
                        }`}
                      >
                        {timeStr}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Masa Seçimine Dön</span>
            </button>

            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-6 py-2.5 rounded-xl bg-orange-500 text-white font-bold text-xs hover:bg-orange-600 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>İletişim Bilgilerine Geç</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: CONTACT DETAILS & CONFIRMATION */}
      {step === 3 && (
        <form onSubmit={handleBookingSubmit} className="space-y-5 animate-in fade-in">
          {/* Summary Box */}
          <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200 text-orange-950 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm">Rezervasyon Özeti</span>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-orange-700 font-semibold underline"
              >
                Düzenle
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-slate-500 block">Masa:</span>
                <strong>{selectedTable?.name}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Kişi Sayısı:</span>
                <strong>{guestCount} Kişi</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Tarih & Saat:</span>
                <strong>
                  {selectedDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}, {selectedTime}
                </strong>
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form Inputs */}
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ad Soyad *</label>
              <input
                type="text"
                required
                placeholder="Örn: Ahmet Yılmaz"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Telefon Numarası (SMS/WhatsApp Onayı) *</label>
              <input
                type="tel"
                required
                placeholder="05XX XXX XX XX"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">E-Posta (İsteğe Bağlı)</label>
              <input
                type="email"
                placeholder="ornek@mail.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Masa / Özel İstek Notu</label>
              <textarea
                rows={2}
                placeholder="Örn: Doğum günü pastası getireceğiz, bebek sandalyesi rica ediyoruz, sakin bir köşe..."
                value={specialRequest}
                onChange={(e) => setSpecialRequest(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 text-xs"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 mt-0.5"
                />
                <span className="text-[11px] text-slate-600 leading-snug">
                  Rezervasyon bilgilerimin işletmeye iletilmesini, SMS/WhatsApp hatırlatma mesajları almayı ve KVKK şartlarını kabul ediyorum.
                </span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Geri</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl bg-orange-500 text-white font-bold text-xs hover:bg-orange-600 transition-all disabled:opacity-50 flex items-center gap-2 shadow-md shadow-orange-500/20"
            >
              {isSubmitting ? (
                <span>Rezervasyon Kaydediliyor...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Rezervasyonu Tamamla</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* STEP 4: SUCCESS CONFIRMATION */}
      {step === 4 && (
        <div className="py-8 text-center space-y-4 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Masa Rezervasyonunuz Alındı!</h3>
            <p className="text-xs text-slate-500 mt-1">
              Rezervasyon detaylarınız işletmeye iletildi ve kaydınız oluşturuldu.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left max-w-md mx-auto space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">İşletme:</span>
              <strong className="text-slate-800">{business.name}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Seçilen Masa:</span>
              <strong className="text-orange-600">{selectedTable?.name}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Kişi Sayısı:</span>
              <strong className="text-slate-800">{guestCount} Kişi</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Tarih & Saat:</span>
              <strong className="text-slate-800">
                {selectedDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}, {selectedTime}
              </strong>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Rezervasyon Sahibi:</span>
              <strong className="text-slate-800">{customerName}</strong>
            </div>
          </div>

          {/* WhatsApp Direct Notification Button */}
          {whatsappUrl && (
            <div className="max-w-md mx-auto pt-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp ile İşletmeye Masayı Bildir</span>
              </a>
            </div>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setSelectedTable(null);
                setCreatedApt(null);
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              Yeni Bir Masa Ayırt
            </button>
          </div>
        </div>
      )}
      {/* 4 Haneli Güvenlik Kodu Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto border border-orange-100">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Masa Rezervasyonu Doğrulaması</h3>
              <p className="text-xs text-slate-500 mt-1">
                Sahte rezervasyonları önlemek için lütfen aşağıdaki 4 haneli güvenlik kodunu girin:
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-orange-50 border border-orange-100">
              <div className="text-[11px] text-orange-700 font-bold uppercase tracking-wider mb-0.5">Güvenlik Kodunuz</div>
              <div className="text-3xl font-black text-orange-700 tracking-widest">{generatedOtp}</div>
            </div>

            <div>
              <input
                type="text"
                maxLength={4}
                autoFocus
                placeholder="4 haneli kodu girin"
                value={enteredOtp}
                onChange={(e) => {
                  setEnteredOtp(e.target.value.replace(/\D/g, ''));
                  setOtpError('');
                }}
                className="w-full text-center text-xl font-bold tracking-widest py-3 px-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500"
              />
              {otpError && <p className="text-xs text-rose-600 font-semibold mt-1.5">{otpError}</p>}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleConfirmOtpAndSubmitTable}
                disabled={isSubmitting || enteredOtp.length !== 4}
                className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? 'Onaylanıyor...' : 'Doğrula & Onayla'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
