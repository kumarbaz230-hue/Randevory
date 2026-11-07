'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { store } from '@/lib/data-store';
import { repo } from '@/lib/supabase-repository';
import { generateAvailableSlots, validateAppointmentConflict } from '@/lib/appointment-engine';
import { Business, Service, Staff, TimeSlot, WorkingHour, Appointment } from '@/types';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  User,
  Scissors,
  Check,
  Building,
  Info,
  CalendarCheck,
} from 'lucide-react';

export default function BusinessPublicPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Wizard Steps: 1: Service, 2: Staff, 3: Date & Slot, 4: Customer Details, 5: Confirmation
  const [step, setStep] = useState<number>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('any'); // 'any' or staff id
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Form Fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [createdAppointment, setCreatedAppointment] = useState<Appointment | null>(null);

  // Load business data
  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      const b = await repo.getBusinessBySlug(slug);
      if (b) {
        setBusiness(b);
        const [srvs, stf, wh, apts] = await Promise.all([
          repo.getServices(b.id),
          repo.getStaff(b.id),
          repo.getWorkingHours(b.id),
          repo.getAppointments(b.id),
        ]);
        setServices(srvs);
        setStaffList(stf);
        setWorkingHours(wh);
        setAppointments(apts);
      }
    };
    load();
  }, [slug]);

  // Next 14 days calendar selector
  const calendarDays = useMemo(() => {
    const days: Date[] = [];
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    for (let i = 0; i < 14; i++) {
      const nextD = new Date(base);
      nextD.setDate(base.getDate() + i);
      days.push(nextD);
    }
    return days;
  }, []);

  // Compute available slots based on service, staff, date, and appointments
  const availableSlots = useMemo(() => {
    if (!selectedService || !business) return [];

    let activeStaffPool = staffList;
    if (selectedStaffId !== 'any') {
      activeStaffPool = staffList.filter((s) => s.id === selectedStaffId);
    }

    return generateAvailableSlots({
      date: selectedDate,
      service: selectedService,
      staffList: activeStaffPool,
      workingHours,
      existingAppointments: appointments,
      slotIntervalMinutes: business.settings.slot_interval_minutes || 30,
    });
  }, [selectedService, selectedStaffId, selectedDate, business, staffList, workingHours, appointments]);

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!business || !selectedService || !selectedSlot) {
      setErrorMessage('Lütfen randevu saatini ve hizmetini eksiksiz seçin.');
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMessage('Lütfen ad soyad ve telefon numaranızı girin.');
      return;
    }

    // Backend / Atomic Conflict Check (Zero Double-Booking Guarantee)
    const conflictValidation = validateAppointmentConflict({
      staffId: selectedSlot.staff_id,
      startTime: selectedSlot.isoStartTime,
      endTime: selectedSlot.isoEndTime,
      existingAppointments: appointments.length > 0 ? appointments : store.getAppointments(business.id),
    });

    if (!conflictValidation.valid) {
      setErrorMessage(
        conflictValidation.reason || 'Üzgünüz, seçilen saat için başka bir randevu oluşturuldu. Lütfen başka bir saat seçin.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const newApt = await repo.createAppointment({
        business_id: business.id,
        service_id: selectedService.id,
        staff_id: selectedSlot.staff_id,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim() || undefined,
        customer_notes: customerNotes.trim() || undefined,
        start_time: selectedSlot.isoStartTime,
        end_time: selectedSlot.isoEndTime,
        total_price: selectedService.price,
        status: business.settings.auto_confirm_appointments ? 'confirmed' : 'pending',
      });

      setCreatedAppointment(newApt);
      setStep(5); // Confirmation screen
    } catch (err: any) {
      setErrorMessage(err.message || 'Randevu kaydedilirken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-md">
          <Building className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900">İşletme Bulunamadı</h2>
          <p className="text-sm text-slate-500 mt-2">
            Aradığınız işletme sayfası mevcut değil veya yayından kaldırılmış olabilir.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Business Header / Hero */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 py-10 sm:py-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-blue-500 flex items-center justify-center text-white text-2xl font-bold shadow-md shadow-brand-500/20 shrink-0">
                {business.name.charAt(0)}
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-brand-300 font-semibold">
                  {business.sector === 'barber' ? 'Berber & Kuaför' : business.sector}
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5 text-white">
                  {business.name}
                </h1>
                <p className="text-sm text-slate-300 mt-1 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-brand-400 shrink-0" />
                  {business.address}, {business.district} / {business.city}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs bg-slate-800/80 p-3 rounded-xl border border-slate-700">
              <Phone className="w-4 h-4 text-brand-400" />
              <a href={`tel:${business.phone}`} className="hover:underline font-medium">
                {business.phone}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 -mt-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          {/* Booking Progress Tracker */}
          {step < 5 && (
            <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-4">
              <div className="flex items-center justify-between max-w-xl mx-auto text-xs font-semibold text-slate-500">
                <div className={`flex items-center gap-1.5 ${step >= 1 ? 'text-brand-600' : ''}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 1 ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-600'}`}>1</span>
                  Hizmet
                </div>
                <div className="w-8 h-0.5 bg-slate-200"></div>
                <div className={`flex items-center gap-1.5 ${step >= 2 ? 'text-brand-600' : ''}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-600'}`}>2</span>
                  Personel
                </div>
                <div className="w-8 h-0.5 bg-slate-200"></div>
                <div className={`flex items-center gap-1.5 ${step >= 3 ? 'text-brand-600' : ''}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 3 ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-600'}`}>3</span>
                  Tarih & Saat
                </div>
                <div className="w-8 h-0.5 bg-slate-200"></div>
                <div className={`flex items-center gap-1.5 ${step >= 4 ? 'text-brand-600' : ''}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 4 ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-600'}`}>4</span>
                  Onay
                </div>
              </div>
            </div>
          )}

          <div className="p-6 sm:p-8">
            {/* STEP 1: SERVICE SELECTION */}
            {step === 1 && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-slate-900">1. Almak İstediğiniz Hizmeti Seçin</h2>
                  <p className="text-sm text-slate-500 mt-1">İşletmenin sunduğu hizmetler ve güncel fiyat tarifesi:</p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      onClick={() => setSelectedService(service)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        selectedService?.id === service.id
                          ? 'border-brand-600 bg-brand-50/40 ring-2 ring-brand-500/20'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          selectedService?.id === service.id ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300'
                        }`}>
                          {selectedService?.id === service.id && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{service.name}</div>
                          {service.description && (
                            <p className="text-xs text-slate-500 mt-0.5">{service.description}</p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {service.duration_minutes} dk
                            </span>
                            {service.category_name && (
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                {service.category_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-4">
                        <span className="text-lg font-bold text-slate-900">{service.price} ₺</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    disabled={!selectedService}
                    onClick={() => setStep(2)}
                    className="px-6 py-3 rounded-xl bg-brand-600 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-700 transition-all flex items-center gap-2"
                  >
                    Personel Seçimine Geç <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: STAFF SELECTION */}
            {step === 2 && (
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">2. Personel Seçimi</h2>
                    <p className="text-sm text-slate-500 mt-1">
                      Hizmet alacağınız uzmanı belirleyin veya herhangi biriyle devam edin.
                    </p>
                  </div>
                  <button
                    onClick={() => setStep(1)}
                    className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Hizmeti Değiştir
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Fark Etmez Seçeneği */}
                  <div
                    onClick={() => setSelectedStaffId('any')}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                      selectedStaffId === 'any'
                        ? 'border-brand-600 bg-brand-50/40 ring-2 ring-brand-500/20'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold shrink-0">
                      <User className="w-6 h-6 text-slate-500" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Fark Etmez (En Uygun Uzman)</div>
                      <p className="text-xs text-slate-500 mt-0.5">Seçtiğiniz saatte müsait olan ilk personelle eşleşin.</p>
                    </div>
                  </div>

                  {/* Personel Listesi */}
                  {staffList.map((st) => (
                    <div
                      key={st.id}
                      onClick={() => setSelectedStaffId(st.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                        selectedStaffId === st.id
                          ? 'border-brand-600 bg-brand-50/40 ring-2 ring-brand-500/20'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shrink-0 text-base"
                        style={{ backgroundColor: st.color_code || '#2563eb' }}
                      >
                        {st.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{st.name}</div>
                        <p className="text-xs text-slate-500 mt-0.5">{st.title || 'Uzman Personel'}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex items-center justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50"
                  >
                    Geri
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="px-6 py-3 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition-all flex items-center gap-2"
                  >
                    Tarih & Saat Seçimine Geç <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: DATE & TIME SLOT SELECTION */}
            {step === 3 && (
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">3. Tarih ve Uygun Saat Seçimi</h2>
                    <p className="text-sm text-slate-500 mt-1">
                      {selectedService?.name} ({selectedService?.duration_minutes} dk) için müsait saatler:
                    </p>
                  </div>
                  <button
                    onClick={() => setStep(2)}
                    className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Personel Değiştir
                  </button>
                </div>

                {/* Day selector horizontal bar */}
                <div className="mb-6 overflow-x-auto pb-2 scrollbar-none">
                  <div className="flex gap-2">
                    {calendarDays.map((d, i) => {
                      const isSelected = d.toDateString() === selectedDate.toDateString();
                      const dayName = d.toLocaleDateString('tr-TR', { weekday: 'short' });
                      const dayNum = d.getDate();
                      const monthName = d.toLocaleDateString('tr-TR', { month: 'short' });

                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setSelectedDate(d);
                            setSelectedSlot(null);
                          }}
                          className={`flex-shrink-0 w-20 py-3 rounded-xl border text-center transition-all ${
                            isSelected
                              ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-500/20'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="text-xs uppercase font-medium opacity-80">{dayName}</div>
                          <div className="text-xl font-bold my-0.5">{dayNum}</div>
                          <div className="text-[10px] font-medium opacity-80">{monthName}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Slots Grid */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-brand-600" />
                    {selectedDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })} Müsait Saatler
                  </h3>

                  {availableSlots.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                      <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-700">Bu tarihte uygun randevu saati bulunmuyor.</p>
                      <p className="text-xs text-slate-500 mt-1">İşletme kapalı olabilir ya da tüm randevular dolmuş olabilir. Lütfen başka bir gün seçin.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                      {availableSlots.map((slot, idx) => {
                        const isChosen = selectedSlot?.time === slot.time;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={`py-2.5 px-3 rounded-lg border text-sm font-semibold transition-all ${
                              isChosen
                                ? 'bg-brand-600 text-white border-brand-600 shadow-md ring-2 ring-brand-500/20'
                                : 'bg-white text-slate-800 border-slate-200 hover:border-brand-500 hover:text-brand-600'
                            }`}
                          >
                            {slot.time}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Selected Slot summary pill */}
                {selectedSlot && (
                  <div className="mt-6 p-4 rounded-xl bg-brand-50/60 border border-brand-200 flex items-center justify-between text-sm">
                    <div>
                      <span className="text-xs text-brand-700 font-semibold uppercase">Seçilen Randevu:</span>
                      <div className="font-bold text-slate-900 mt-0.5">
                        {selectedDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} saat {selectedSlot.time}
                        <span className="text-slate-500 font-normal"> ({selectedSlot.staff_name})</span>
                      </div>
                    </div>
                    <div className="font-bold text-brand-700 text-base">{selectedService?.price} ₺</div>
                  </div>
                )}

                <div className="mt-8 flex items-center justify-between">
                  <button
                    onClick={() => setStep(2)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50"
                  >
                    Geri
                  </button>
                  <button
                    disabled={!selectedSlot}
                    onClick={() => setStep(4)}
                    className="px-6 py-3 rounded-xl bg-brand-600 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-700 transition-all flex items-center gap-2"
                  >
                    İletişim Bilgilerine Geç <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: CUSTOMER DETAILS & FINAL CONFIRMATION FORM */}
            {step === 4 && (
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">4. İletişim Bilgileriniz</h2>
                    <p className="text-sm text-slate-500 mt-1">
                      Randevu onayı ve hatırlatma bildirimleri için bilgilerinizi girin.
                    </p>
                  </div>
                  <button
                    onClick={() => setStep(3)}
                    className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Saati Değiştir
                  </button>
                </div>

                {/* Summary Card */}
                <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500">Hizmet</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedService?.name}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Uzman</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedSlot?.staff_name}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Tarih & Saat</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">
                      {selectedDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} - {selectedSlot?.time}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Ücret</span>
                    <p className="font-bold text-brand-600 text-sm mt-0.5">{selectedService?.price} ₺</p>
                  </div>
                </div>

                {errorMessage && (
                  <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleBookAppointment} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Adınız ve Soyadınız *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: Mehmet Demir"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                        Telefon Numaranız *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="Örn: 0532 000 0000"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                        E-posta Adresiniz (Opsiyonel)
                      </label>
                      <input
                        type="email"
                        placeholder="Örn: mehmet@example.com"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      İşletmeye Notunuz (Opsiyonel)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Varsa özel isteklerinizi belirtebilirsiniz..."
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    ></textarea>
                  </div>

                  <div className="pt-4 flex items-center justify-between border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50"
                    >
                      Geri
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-8 py-3 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 disabled:opacity-50 transition-all shadow-md shadow-brand-500/20 flex items-center gap-2"
                    >
                      {isSubmitting ? 'Kaydediliyor...' : 'Randevuyu Onayla'}
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 5: SUCCESS CONFIRMATION SCREEN */}
            {step === 5 && createdAppointment && (
              <div className="py-8 text-center max-w-md mx-auto">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Randevunuz Başarıyla Alındı!</h2>
                <p className="text-sm text-slate-600 mt-2">
                  Sayın <span className="font-semibold text-slate-900">{customerName}</span>, randevu kaydınız oluşturuldu ve onaylandı.
                </p>

                <div className="mt-6 p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left text-sm space-y-2.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Randevu No:</span>
                    <span className="font-mono font-bold text-slate-900">
                      #{createdAppointment.id.length > 8 ? createdAppointment.id.slice(0, 8).toUpperCase() : createdAppointment.id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">İşletme:</span>
                    <span className="font-semibold text-slate-900">{business.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Hizmet:</span>
                    <span className="font-semibold text-slate-900">{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Personel:</span>
                    <span className="font-semibold text-slate-900">{selectedSlot?.staff_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Zaman:</span>
                    <span className="font-semibold text-slate-900">
                      {new Date(createdAppointment.start_time).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 font-bold">
                    <span>Toplam Ücret:</span>
                    <span className="text-brand-600">{createdAppointment.total_price} ₺</span>
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-2.5">
                  <Link
                    href={`/${business.slug}`}
                    onClick={() => {
                      setStep(1);
                      setSelectedService(null);
                      setSelectedSlot(null);
                      setCustomerName('');
                      setCustomerPhone('');
                    }}
                    className="w-full py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
                  >
                    Yeni Bir Randevu Al
                  </Link>
                  <Link
                    href="/dashboard"
                    className="w-full py-3 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors"
                  >
                    İşletme Yönetim Paneline Git
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Business Info Footer in page */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-500">
          <div className="p-4 rounded-xl bg-white border border-slate-200">
            <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-1.5 text-sm">
              <Clock className="w-4 h-4 text-slate-500" /> Çalışma Saatleri
            </h4>
            <div className="space-y-1">
              <div>Pazartesi - Cuma: 09:00 - 19:00</div>
              <div>Cumartesi: 10:00 - 18:00</div>
              <div>Pazar: Kapalı</div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200">
            <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-1.5 text-sm">
              <Info className="w-4 h-4 text-slate-500" /> İptal Politikası
            </h4>
            <p className="leading-relaxed">
              Randevularınızı, randevu saatinden en geç {business.settings.cancellation_deadline_hours} saat öncesine kadar işletmeyi arayarak ücretsiz olarak iptal edebilir veya erteleyebilirsiniz.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
