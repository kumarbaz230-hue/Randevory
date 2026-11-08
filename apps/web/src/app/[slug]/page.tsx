'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { store } from '@/lib/data-store';
import { repo } from '@/lib/supabase-repository';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { generateAvailableSlots, validateAppointmentConflict } from '@/lib/appointment-engine';
import {
  Business,
  Service,
  Staff,
  TimeSlot,
  WorkingHour,
  Appointment,
  ChatMessage,
} from '@/types';
import { BusinessQrModal } from '@/components/business-qr-modal';
import { createCustomerToBusinessWhatsAppUrl } from '@/lib/whatsapp-helper';
import Link from 'next/link';
import {
  Clock,
  MapPin,
  Phone,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  User,
  Check,
  Building,
  Info,
  ShieldCheck,
  X,
  Calendar,
  Search,
  MessageSquare,
  Send,
  QrCode,
  XCircle,
  Sparkles,
} from 'lucide-react';

export default function BusinessPublicPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Top-level active tab: 'book' | 'manage' | 'chat'
  const [activeTab, setActiveTab] = useState<'book' | 'manage' | 'chat'>('book');
  const [showQrModal, setShowQrModal] = useState(false);

  const daysTurkish = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

  // Wizard Steps: 1: Service, 2: Staff, 3: Date & Slot, 4: Customer Details, 5: Confirmation
  const [step, setStep] = useState<number>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('any');
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Booking Form Fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [customerConsent, setCustomerConsent] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [createdAppointment, setCreatedAppointment] = useState<Appointment | null>(null);

  // Manage / Cancel Appointments State
  const [lookupPhone, setLookupPhone] = useState('');
  const [searchedPhone, setSearchedPhone] = useState('');
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [isSearchingApts, setIsSearchingApts] = useState(false);
  const [cancellingApt, setCancellingApt] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('Planım değişti');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelFeedback, setCancelFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Customer Live Chat State
  const [chatName, setChatName] = useState('');
  const [chatPhone, setChatPhone] = useState('');
  const [isChatJoined, setIsChatJoined] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load saved customer profile from localStorage if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedName = localStorage.getItem('randevory_cust_name') || '';
      const savedPhone = localStorage.getItem('randevory_cust_phone') || '';
      if (savedName) {
        setCustomerName(savedName);
        setChatName(savedName);
      }
      if (savedPhone) {
        setCustomerPhone(savedPhone);
        setLookupPhone(savedPhone);
        setChatPhone(savedPhone);
        if (savedName && repo.normalizePhone(savedPhone).length >= 10) {
          setIsChatJoined(true);
        }
      }
    }
  }, []);

  const loadBusinessData = async () => {
    if (!slug) return;
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

  useEffect(() => {
    loadBusinessData();
  }, [slug]);

  // Auto-load customer appointments when switching to 'manage' tab if phone is known
  useEffect(() => {
    if (activeTab === 'manage' && business && repo.normalizePhone(lookupPhone).length >= 10) {
      handleLookupAppointments(undefined, lookupPhone);
    }
  }, [activeTab, business]);

  // Live Chat Polling & Realtime Subscription
  useEffect(() => {
    if (!business || !isChatJoined) return;
    const normPhone = repo.normalizePhone(chatPhone);
    if (normPhone.length < 10) return;

    const fetchMsgs = () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      repo.getChatMessages(business.id, normPhone).then((msgs) => {
        setChatMessages(msgs);
        repo.markMessagesAsRead(business.id, normPhone, 'customer');
      });
    };

    fetchMsgs();
    const timer = setInterval(fetchMsgs, isSupabaseConfigured() ? 15000 : 5000);

    let channel: any = null;
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      channel = supabase
        .channel(`cust-chat-${business.id}-${normPhone}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'chat_messages',
            filter: `business_id=eq.${business.id}`,
          },
          () => fetchMsgs()
        )
        .subscribe();
    }

    return () => {
      clearInterval(timer);
      if (channel && isSupabaseConfigured()) {
        const supabase = createClient();
        supabase.removeChannel(channel);
      }
    };
  }, [business, isChatJoined, chatPhone]);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages.length, activeTab]);

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

  const saveCustomerIdentity = (name: string, phone: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('randevory_cust_name', name.trim());
      localStorage.setItem('randevory_cust_phone', phone.trim());
    }
    setLookupPhone(phone.trim());
    setChatName(name.trim());
    setChatPhone(phone.trim());
    if (name.trim() && repo.normalizePhone(phone).length >= 10) {
      setIsChatJoined(true);
    }
  };

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

    if (repo.normalizePhone(customerPhone).length < 10) {
      setErrorMessage('Lütfen geçerli bir 10 veya 11 haneli telefon numarası girin (Örn: 0532 000 0000).');
      return;
    }

    if (!customerConsent) {
      setErrorMessage('Randevu oluşturabilmek için lütfen KVKK ve Randevu Koşulları onay kutusunu işaretleyin.');
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
        status: business.settings?.auto_confirm_appointments === false ? 'pending' : 'confirmed',
      });

      saveCustomerIdentity(customerName, customerPhone);
      setCreatedAppointment(newApt);

      // 1. Otomatik Sistem Sohbet Bildirimi + 2. Otomatik SMS Tetikleme (İşletme & Müşteri)
      const aptTimeFormatted = new Date(newApt.start_time).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      });
      repo
        .sendChatMessage({
          business_id: business.id,
          customer_phone: customerPhone.trim(),
          customer_name: customerName.trim(),
          sender_type: 'customer',
          appointment_id: newApt.id,
          message: `📅 [YENİ RANDEVU BİLDİRİMİ] ${aptTimeFormatted} için "${selectedService.name}" (${selectedService.price} ₺) randevusu oluşturuldu.${
            customerNotes.trim() ? ` Not: ${customerNotes.trim()}` : ''
          }`,
        })
        .catch(() => {});

      fetch('/api/notifications/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'appointment_created',
          businessName: business.name,
          businessPhone: business.phone,
          businessSlug: business.slug,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          serviceName: selectedService.name,
          startTime: newApt.start_time,
          totalPrice: selectedService.price,
        }),
      }).catch(() => {});

      await loadBusinessData();
      setStep(5); // Confirmation screen
    } catch (err: any) {
      setErrorMessage(err.message || 'Randevu kaydedilirken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLookupAppointments = async (e?: React.FormEvent, customPhone?: string) => {
    if (e) e.preventDefault();
    if (!business) return;
    const phoneToUse = (customPhone ?? lookupPhone).trim();
    const norm = repo.normalizePhone(phoneToUse);
    if (norm.length < 10) {
      setCancelFeedback({
        type: 'error',
        text: 'Lütfen randevu alırken kullandığınız 10-11 haneli telefon numaranızı girin.',
      });
      return;
    }

    setCancelFeedback(null);
    setIsSearchingApts(true);
    try {
      const found = await repo.getCustomerAppointmentsByPhone(business.id, phoneToUse);
      setMyAppointments(found);
      setSearchedPhone(phoneToUse);
      if (typeof window !== 'undefined') {
        localStorage.setItem('randevory_cust_phone', phoneToUse);
      }
    } finally {
      setIsSearchingApts(false);
    }
  };

  const handleConfirmCancelAppointment = async () => {
    if (!cancellingApt || !business) return;
    setIsCancelling(true);
    setCancelFeedback(null);

    try {
      const res = await repo.cancelCustomerAppointment(
        cancellingApt.id,
        cancellingApt.customer_phone,
        cancelReason
      );

      if (!res.success) {
        setCancelFeedback({
          type: 'error',
          text: res.error || 'Randevu iptal edilemedi.',
        });
      } else {
        setCancelFeedback({
          type: 'success',
          text: 'Randevunuz başarıyla iptal edildi ve saat dilimi boşa çıkarıldı.',
        });

        fetch('/api/notifications/sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'appointment_cancelled',
            businessName: business.name,
            businessPhone: business.phone,
            businessSlug: business.slug,
            customerName: cancellingApt.customer_name,
            customerPhone: cancellingApt.customer_phone,
            startTime: cancellingApt.start_time,
            cancelReason,
          }),
        }).catch(() => {});

        setCancellingApt(null);
        await loadBusinessData();
        const updated = await repo.getCustomerAppointmentsByPhone(
          business.id,
          cancellingApt.customer_phone
        );
        setMyAppointments(updated);
        if (createdAppointment?.id === cancellingApt.id) {
          setCreatedAppointment({ ...createdAppointment, status: 'cancelled' });
        }
      }
    } finally {
      setIsCancelling(false);
    }
  };

  const handleJoinChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatName.trim() || repo.normalizePhone(chatPhone).length < 10) {
      return;
    }
    saveCustomerIdentity(chatName, chatPhone);
    setIsChatJoined(true);
  };

  const handleSendCustomerMessage = async (e?: React.FormEvent, quickText?: string) => {
    if (e) e.preventDefault();
    const text = (quickText ?? chatInput).trim();
    if (!business || !text || isSendingChat) return;

    setIsSendingChat(true);
    try {
      const sent = await repo.sendChatMessage({
        business_id: business.id,
        customer_phone: chatPhone,
        customer_name: chatName,
        sender_type: 'customer',
        message: text,
      });
      setChatMessages((prev) => [...prev, sent]);
      if (!quickText) setChatInput('');
    } catch (err: any) {
      alert(err.message || 'Mesaj gönderilemedi.');
    } finally {
      setIsSendingChat(false);
    }
  };

  const unreadFromBusiness = useMemo(
    () => chatMessages.filter((m) => m.sender_type === 'business' && !m.is_read).length,
    [chatMessages]
  );

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
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Business Header / Hero */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 py-10 sm:py-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-blue-500 flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-md shadow-brand-500/20 shrink-0">
                {business.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <span className="text-xs uppercase tracking-wider text-brand-300 font-semibold">
                  {business.sector === 'barber' ? 'Berber & Kuaför' : business.sector}
                </span>
                <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight mt-0.5 text-white break-words">
                  {business.name}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                  <span className="break-words min-w-0">{business.address}, {business.district} / {business.city}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 text-xs bg-slate-800/90 hover:bg-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-700 font-semibold text-brand-300 transition-colors"
              >
                <QrCode className="w-4 h-4" />
                QR Kod
              </button>
              <div className="flex-1 sm:flex-none justify-center flex items-center gap-2 text-xs bg-slate-800/90 px-3.5 py-2.5 rounded-xl border border-slate-700">
                <Phone className="w-4 h-4 text-brand-400" />
                <a href={`tel:${business.phone}`} className="hover:underline font-medium">
                  {business.phone}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 -mt-5">
        {/* Top Action Mode Switcher (Book / Manage & Cancel / Live Chat) */}
        <div className="mb-4 bg-white p-1.5 rounded-2xl border border-slate-200/90 shadow-sm grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('book')}
            className={`py-3 px-1.5 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-center leading-tight ${
              activeTab === 'book'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4 shrink-0" />
            <span>Randevu Al</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manage')}
            className={`py-3 px-1.5 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-center leading-tight ${
              activeTab === 'manage'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Search className="w-4 h-4 shrink-0" />
            <span>
              <span className="sm:hidden">Sorgula</span>
              <span className="hidden sm:inline">Randevu Sorgula / İptal</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`py-3 px-1.5 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-center leading-tight relative ${
              activeTab === 'chat'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span>
              <span className="sm:hidden">Mesaj</span>
              <span className="hidden sm:inline">İşletmeye Mesaj Yaz</span>
            </span>
            {unreadFromBusiness > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold">
                {unreadFromBusiness}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: BOOK APPOINTMENT WIZARD */}
        {activeTab === 'book' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            {/* Booking Progress Tracker */}
            {step < 5 && (
              <div className="border-b border-slate-200 bg-slate-50/50 px-4 sm:px-6 py-3 sm:py-4">
                <div className="flex items-center justify-between max-w-xl mx-auto text-xs font-semibold text-slate-500">
                  {[
                    { n: 1, label: 'Hizmet' },
                    { n: 2, label: 'Personel' },
                    { n: 3, label: 'Tarih & Saat' },
                    { n: 4, label: 'Onay' },
                  ].map((s, i) => (
                    <React.Fragment key={s.n}>
                      {i > 0 && <div className="flex-1 min-w-2 max-w-8 h-0.5 bg-slate-200 mx-1"></div>}
                      <div className={`flex items-center gap-1.5 ${step >= s.n ? 'text-brand-600' : ''}`}>
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${
                            step >= s.n ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {s.n}
                        </span>
                        {/* Telefonda sadece aktif adımın adı görünür, kalan adımlar sadece numara */}
                        <span className={step === s.n ? 'inline' : 'hidden sm:inline'}>{s.label}</span>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 sm:p-8">
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
                        Randevu onayı, sorgulama ve hatırlatma bildirimleri için bilgilerinizi girin.
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
                        placeholder="Adınız ve Soyadınız"
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
                          placeholder="0532 000 0000"
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
                          placeholder="ornek@eposta.com"
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

                    {/* Müşteri KVKK ve Sorumluluk Onay Kutusu */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <label className="flex items-start gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={customerConsent}
                          onChange={(e) => setCustomerConsent(e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 shrink-0"
                        />
                        <span className="text-xs text-slate-600 leading-relaxed">
                          Randevu oluşturulması ve takibi amacıyla iletişim bilgilerimin <strong>{business.name}</strong> işletmesi ile paylaşılmasını,{' '}
                          <button
                            type="button"
                            onClick={() => setShowConsentModal(true)}
                            className="font-bold text-brand-600 hover:underline"
                          >
                            KVKK Aydınlatma Metni ve Randevu Koşullarını
                          </button>{' '}
                          okuduğumu ve kabul ettiğimi onaylıyorum. *
                        </span>
                      </label>
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
                        disabled={isSubmitting || !customerConsent}
                        className="px-8 py-3 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-brand-500/20 flex items-center gap-2"
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
                <div className="py-6 text-center max-w-md mx-auto">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                      createdAppointment.status === 'cancelled'
                        ? 'bg-rose-100 text-rose-600'
                        : createdAppointment.status === 'pending'
                        ? 'bg-amber-100 text-amber-600'
                        : 'bg-emerald-100 text-emerald-600'
                    }`}
                  >
                    {createdAppointment.status === 'pending' ? (
                      <Clock className="w-10 h-10" />
                    ) : (
                      <CheckCircle2 className="w-10 h-10" />
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {createdAppointment.status === 'cancelled'
                      ? 'Randevunuz İptal Edildi'
                      : createdAppointment.status === 'pending'
                      ? 'Randevu Talebiniz Alındı! (Onay Bekliyor)'
                      : 'Randevunuz Başarıyla Alındı!'}
                  </h2>
                  <p className="text-sm text-slate-600 mt-2">
                    Sayın <span className="font-semibold text-slate-900">{customerName}</span>,{' '}
                    {createdAppointment.status === 'pending'
                      ? 'randevunuz oluşturuldu ve işletme onayına iletildi. İşletme onayladığında durumunuz "Onaylandı" olarak güncellenecektir.'
                      : 'randevu detaylarınız aşağıdadır. İstediğiniz zaman telefon numaranızla randevunuzu sorgulayabilir, iptal edebilir veya işletmeye mesaj yazabilirsiniz.'}
                  </p>

                  <div className="mt-6 p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left text-sm space-y-2.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Randevu Kodu:</span>
                      <span className="font-mono font-bold text-slate-900">
                        #{createdAppointment.id.length > 8 ? createdAppointment.id.slice(0, 8).toUpperCase() : createdAppointment.id}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Durum:</span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          createdAppointment.status === 'cancelled'
                            ? 'bg-rose-100 text-rose-700'
                            : createdAppointment.status === 'pending'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {createdAppointment.status === 'cancelled'
                          ? 'İptal Edildi'
                          : createdAppointment.status === 'pending'
                          ? '⏳ İşletme Onayı Bekliyor'
                          : 'Onaylandı'}
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

                  {createdAppointment.status !== 'cancelled' && (
                    <div className="mt-5">
                      <a
                        href={createCustomerToBusinessWhatsAppUrl({
                          businessPhone: business.phone,
                          businessName: business.name,
                          customerName: createdAppointment.customer_name,
                          customerPhone: createdAppointment.customer_phone,
                          serviceName: selectedService?.name || 'Randevu',
                          staffName: selectedSlot?.staff_name,
                          startTime: createdAppointment.start_time,
                          totalPrice: createdAppointment.total_price,
                          appointmentId: createdAppointment.id,
                          notes: createdAppointment.customer_notes,
                        })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
                      >
                        <Phone className="w-4 h-4" />
                        Randevu Bilgisini İşletmeye WhatsApp&apos;tan İlet
                      </a>
                    </div>
                  )}

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setActiveTab('chat')}
                      className="py-3 px-4 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <MessageSquare className="w-4 h-4" />
                      İşletmeye Mesaj Gönder
                    </button>

                    {createdAppointment.status !== 'cancelled' && (
                      <button
                        type="button"
                        onClick={() => setCancellingApt(createdAppointment)}
                        className="py-3 px-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        Randevuyu İptal Et
                      </button>
                    )}
                  </div>

                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setStep(1);
                        setSelectedService(null);
                        setSelectedSlot(null);
                        setCreatedAppointment(null);
                        setCustomerConsent(false);
                      }}
                      className="w-full py-3 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
                    >
                      Yeni Bir Randevu Al
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MANAGE & CANCEL APPOINTMENTS */}
        {activeTab === 'manage' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Search className="w-5 h-5 text-brand-600" />
                Randevularım & Online İptal İşlemleri
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Randevu alırken kullandığınız telefon numaranızı girerek aktif randevularınızı görüntüleyebilir veya ücretsiz iptal edebilirsiniz.
              </p>
            </div>

            <form onSubmit={(e) => handleLookupAppointments(e)} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  placeholder="Telefon numaranız (Örn: 0532 000 0000)"
                  value={lookupPhone}
                  onChange={(e) => setLookupPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <button
                type="submit"
                disabled={isSearchingApts}
                className="px-6 py-3 rounded-xl bg-brand-600 text-white font-bold text-sm hover:bg-brand-700 transition-colors flex items-center justify-center gap-2 shrink-0 shadow-sm"
              >
                <Search className="w-4 h-4" />
                {isSearchingApts ? 'Sorgulanıyor...' : 'Randevularımı Getir'}
              </button>
            </form>

            {cancelFeedback && (
              <div
                className={`p-4 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                  cancelFeedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}
              >
                {cancelFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                )}
                <span>{cancelFeedback.text}</span>
              </div>
            )}

            {searchedPhone && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    <strong>{searchedPhone}</strong> numarası için bulunan randevular ({myAppointments.length}):
                  </span>
                </div>

                {myAppointments.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-300 space-y-2">
                    <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-sm font-semibold text-slate-700">
                      Bu telefon numarasına ait randevu bulunamadı.
                    </p>
                    <p className="text-xs text-slate-500">
                      Numaranızı doğru yazdığınızdan emin olun veya yeni bir randevu oluşturun.
                    </p>
                  </div>
                ) : (
                  myAppointments.map((apt) => {
                    const srv = services.find((s) => s.id === apt.service_id);
                    const stf = staffList.find((s) => s.id === apt.staff_id);
                    const startDate = new Date(apt.start_time);
                    const canCancel = apt.status === 'confirmed' || apt.status === 'pending';

                    return (
                      <div
                        key={apt.id}
                        className="p-5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-500">
                              #{apt.id.slice(0, 8).toUpperCase()}
                            </span>
                            <span className="font-bold text-sm text-slate-900">
                              {srv?.name || 'Randevu Hizmeti'}
                            </span>
                            <span
                              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                                apt.status === 'confirmed'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : apt.status === 'pending'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : apt.status === 'completed'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {apt.status === 'confirmed'
                                ? 'Onaylandı'
                                : apt.status === 'pending'
                                ? 'Onay Bekliyor'
                                : apt.status === 'completed'
                                ? 'Tamamlandı'
                                : 'İptal Edildi'}
                            </span>
                          </div>

                          <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="flex items-center gap-1 font-semibold text-slate-800">
                              <Clock className="w-3.5 h-3.5 text-brand-600" />
                              {startDate.toLocaleDateString('tr-TR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                weekday: 'short',
                              })}{' '}
                              saat{' '}
                              {startDate.toLocaleTimeString('tr-TR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <span>•</span>
                            <span>Uzman: {stf?.name || 'Belirtilmedi'}</span>
                            <span>•</span>
                            <span className="font-bold text-brand-600">{apt.total_price} ₺</span>
                          </div>

                          {apt.status === 'cancelled' && apt.cancellation_reason && (
                            <p className="text-[11px] text-rose-600">
                              İptal Nedeni: {apt.cancellation_reason}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              saveCustomerIdentity(apt.customer_name, apt.customer_phone);
                              setActiveTab('chat');
                            }}
                            className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-brand-600" />
                            İşletmeye Yaz
                          </button>

                          {canCancel && (
                            <button
                              type="button"
                              onClick={() => setCancellingApt(apt)}
                              className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Randevuyu İptal Et
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CUSTOMER <-> BUSINESS LIVE CHAT */}
        {activeTab === 'chat' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-slate-900 to-brand-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center font-bold">
                  {business.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-sm">{business.name} – Canlı Mesajlaşma</h2>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Randevunuz, hizmetler veya fiyatlar hakkında doğrudan işletmeye yazın.
                  </p>
                </div>
              </div>

              {isChatJoined && (
                <button
                  type="button"
                  onClick={() => setIsChatJoined(false)}
                  className="text-[11px] text-slate-300 hover:text-white underline"
                >
                  Bilgileri Değiştir ({chatName})
                </button>
              )}
            </div>

            {!isChatJoined ? (
              <form onSubmit={handleJoinChat} className="p-6 sm:p-8 max-w-md mx-auto space-y-4">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-2">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900">Sohbete Başlayın</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    İşletmenin size yanıt verebilmesi ve geçmiş mesajlarınızı görebilmeniz için adınızı ve telefon numaranızı girin.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Adınız ve Soyadınız *</label>
                  <input
                    type="text"
                    required
                    placeholder="Adınız ve Soyadınız"
                    value={chatName}
                    onChange={(e) => setChatName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Telefon Numaranız *</label>
                  <input
                    type="tel"
                    required
                    placeholder="0532 000 0000"
                    value={chatPhone}
                    onChange={(e) => setChatPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-brand-600 text-white font-bold text-sm hover:bg-brand-700 transition-colors shadow-sm"
                >
                  Sohbete Bağlan &rarr;
                </button>
              </form>
            ) : (
              <div className="flex flex-col h-[480px]">
                {/* Messages Area */}
                <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-slate-50/60">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-10 space-y-3">
                      <p className="text-xs text-slate-500">
                        Merhaba <strong>{chatName}</strong>! {business.name} işletmesine aşağıdan hemen mesaj gönderebilirsiniz.
                      </p>
                      <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
                        {[
                          'Merhaba, randevu saatimi değiştirebilir miyim?',
                          'Hizmet ve fiyatlar hakkında bilgi alabilir miyim?',
                          'Bugün için boş yeriniz var mı?',
                        ].map((q, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSendCustomerMessage(undefined, q)}
                            className="px-3 py-1.5 rounded-full bg-white border border-slate-200 hover:border-brand-400 text-xs text-slate-700 hover:text-brand-600 transition-colors shadow-sm"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    chatMessages.map((msg) => {
                      const isMe = msg.sender_type === 'customer';
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-xs shadow-sm ${
                              isMe
                                ? 'bg-brand-600 text-white rounded-br-none'
                                : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                            }`}
                          >
                            {!isMe && (
                              <div className="text-[10px] font-bold text-brand-600 mb-0.5">
                                {business.name}
                              </div>
                            )}
                            <div className="leading-relaxed whitespace-pre-wrap">{msg.message}</div>
                            <div
                              className={`text-[10px] mt-1 text-right ${
                                isMe ? 'text-brand-100' : 'text-slate-400'
                              }`}
                            >
                              {new Date(msg.created_at).toLocaleTimeString('tr-TR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input Bar */}
                <form
                  onSubmit={(e) => handleSendCustomerMessage(e)}
                  className="p-4 bg-white border-t border-slate-200 flex items-center gap-2.5"
                >
                  <input
                    type="text"
                    placeholder="İşletmeye mesajınızı yazın..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || isSendingChat}
                    className="px-5 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 disabled:opacity-50 transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Gönder
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Business Info Footer in page */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-500">
          <div className="p-4 rounded-xl bg-white border border-slate-200">
            <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-1.5 text-sm">
              <Clock className="w-4 h-4 text-slate-500" /> Çalışma Saatleri
            </h4>
            <div className="space-y-1">
              {workingHours.length > 0 ? (
                [1, 2, 3, 4, 5, 6, 0].map((dayIdx) => {
                  const wh = workingHours.find((w) => w.day_of_week === dayIdx);
                  return (
                    <div key={dayIdx} className="flex justify-between">
                      <span className="font-medium text-slate-700">{daysTurkish[dayIdx]}:</span>
                      <span>
                        {wh && wh.is_open
                          ? `${wh.open_time.slice(0, 5)} - ${wh.close_time.slice(0, 5)}`
                          : 'Kapalı'}
                      </span>
                    </div>
                  );
                })
              ) : (
                <>
                  <div>Pazartesi - Cuma: 09:00 - 19:00</div>
                  <div>Cumartesi: 10:00 - 18:00</div>
                  <div>Pazar: Kapalı</div>
                </>
              )}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200">
            <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-1.5 text-sm">
              <Info className="w-4 h-4 text-slate-500" /> Online İptal & Mesajlaşma
            </h4>
            <p className="leading-relaxed">
              Randevularınızı, randevu saatinden en geç {business.settings.cancellation_deadline_hours} saat öncesine kadar yukarıdaki{' '}
              <button
                type="button"
                onClick={() => setActiveTab('manage')}
                className="font-bold text-brand-600 hover:underline"
              >
                Randevu Sorgula / İptal
              </button>{' '}
              sekmesinden tek tıkla ücretsiz iptal edebilir veya{' '}
              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                className="font-bold text-brand-600 hover:underline"
              >
                İşletmeye Mesaj Yaz
              </button>{' '}
              bölümünden doğrudan işletmeyle iletişime geçebilirsiniz.
            </p>
          </div>
        </div>

        {/* Powered by RANDEVORY Footer */}
        <footer className="mt-10 py-6 text-center text-xs text-slate-400 border-t border-slate-200/80 space-y-1.5">
          <p>
            Güvenli Randevu Altyapısı – <Link href="/" className="font-bold text-slate-600 hover:text-brand-600">RANDEVORY</Link> • <em>İşini kolaylaştır, zamanını kazan.</em>
          </p>
          <p className="text-[11px]">
            <Link href="/yasal#kvkk" className="hover:underline">KVKK Aydınlatma Metni</Link> •{' '}
            <Link href="/yasal#sorumluluk" className="hover:underline">Kullanım ve Sorumluluk Şartları</Link>
          </p>
        </footer>
      </main>

      {/* Floating Live Chat Bubble (when not on chat tab) */}
      {activeTab !== 'chat' && (
        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          className="fixed bottom-5 right-5 z-40 px-4 py-3 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-xl shadow-brand-600/30 flex items-center gap-2 transition-transform hover:scale-105"
        >
          <MessageSquare className="w-4 h-4" />
          <span>İşletmeye Sor</span>
          {unreadFromBusiness > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px]">
              {unreadFromBusiness}
            </span>
          )}
        </button>
      )}

      {/* Appointment Cancellation Confirmation Modal */}
      {cancellingApt && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600" />
                Randevu İptal Onayı
              </h3>
              <button
                type="button"
                onClick={() => setCancellingApt(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                <strong>
                  {new Date(cancellingApt.start_time).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </strong>{' '}
                tarihli randevunuzu iptal etmek üzeresiniz.
              </p>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  İptal Nedeniniz (Opsiyonel)
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500"
                >
                  <option value="Planım değişti">Planım değişti</option>
                  <option value="Başka bir gün/saate randevu alacağım">Başka bir gün/saate randevu alacağım</option>
                  <option value="Acil bir durum oluştu">Acil bir durum oluştu</option>
                  <option value="Yanlış saat seçtim">Yanlış saat seçtim</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancellingApt(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={handleConfirmCancelAppointment}
                className="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-50 transition-colors"
              >
                {isCancelling ? 'İptal Ediliyor...' : 'Evet, Randevuyu İptal Et'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Müşteri KVKK ve Sorumluluk Bilgilendirme Modalı */}
      {showConsentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand-400" />
                <h3 className="font-bold text-sm">KVKK Aydınlatma Metni ve Randevu Koşulları</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConsentModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto text-xs text-slate-600 space-y-3 leading-relaxed">
              <p>
                <strong>1. Kişisel Verilerin İşlenmesi (KVKK):</strong> Girmiş olduğunuz Ad Soyad, Telefon Numarası, E-posta ve Randevu Notu bilgileriniz; yalnızca randevunuzun oluşturulması, çakışmaların önlenmesi ve randevu bilgilendirmelerinin yapılması amacıyla 6698 sayılı KVKK kapsamında randevu aldığınız <strong>{business.name}</strong> işletmesi (Veri Sorumlusu) ile paylaşılmaktadır.
              </p>
              <p>
                <strong>2. Hizmet ve Sorumluluk Sınırı:</strong> <strong>RANDEVORY</strong> yalnızca randevu takibini sağlayan teknik yazılım altyapısıdır. Randevu aldığınız hizmetin sunulması, kalitesi, fiyatlandırılması, ücret tahsilatı veya randevu iptal/erteleme süreçlerinden doğrudan randevu aldığınız <strong>{business.name}</strong> işletmesi sorumludur.
              </p>
              <p>
                <strong>3. İptal ve Değişiklik:</strong> Randevunuza katılamayacağınız durumlarda en geç {business.settings.cancellation_deadline_hours} saat öncesinden sayfadaki <strong>Randevu Sorgula / İptal</strong> sekmesinden veya işletme telefonundan iptal işlemi yapabilirsiniz.
              </p>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <Link href="/yasal" target="_blank" className="text-xs font-semibold text-slate-500 hover:text-slate-800">
                Detaylı Hukuki Metin &rarr;
              </Link>
              <button
                type="button"
                onClick={() => {
                  setCustomerConsent(true);
                  setShowConsentModal(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition-colors flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Okudum ve Onaylıyorum
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Business QR Code Modal */}
      <BusinessQrModal
        businessName={business.name}
        slug={business.slug}
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
      />
    </div>
  );
}
