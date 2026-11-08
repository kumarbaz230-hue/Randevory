'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { repo } from '@/lib/supabase-repository';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Business, WorkingHour, SubscriptionPlan } from '@/types';
import { BusinessQrModal } from '@/components/business-qr-modal';
import {
  Clock,
  Building,
  CreditCard,
  Save,
  Check,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  QrCode,
  Gift,
  Sparkles,
} from 'lucide-react';

export default function DashboardSettingsPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  const [savedMessage, setSavedMessage] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [slotInterval, setSlotInterval] = useState(30);
  const [autoConfirm, setAutoConfirm] = useState(true);
  const [cancelHours, setCancelHours] = useState(2);

  // Loyalty Program State (İsteğe bağlı pazarlama)
  const [loyaltyEnabled, setLoyaltyEnabled] = useState(false);
  const [loyaltyTarget, setLoyaltyTarget] = useState(5);
  const [loyaltyRewardType, setLoyaltyRewardType] = useState<'discount_percent' | 'free_service' | 'custom_gift'>('discount_percent');
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(20);
  const [loyaltyTitle, setLoyaltyTitle] = useState('Her 5. randevunuzda %20 İndirim!');

  // Password Change State
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

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
        setSlotInterval(b.settings.slot_interval_minutes ?? 30);
        setAutoConfirm(b.settings.auto_confirm_appointments !== false);
        setCancelHours(b.settings.cancellation_deadline_hours ?? 2);

        const lp = b.settings?.loyalty_program;
        if (lp) {
          setLoyaltyEnabled(Boolean(lp.enabled));
          setLoyaltyTarget(lp.target_appointments ?? 5);
          setLoyaltyRewardType(lp.reward_type ?? 'discount_percent');
          setLoyaltyDiscount(lp.discount_percent ?? 20);
          setLoyaltyTitle(lp.reward_title ?? 'Her 5. randevunuzda %20 İndirim!');
        }

        const [wh, plans] = await Promise.all([
          repo.getWorkingHours(b.id),
          repo.getSubscriptionPlans(),
        ]);
        setWorkingHours(
          wh.map((h) => ({
            ...h,
            open_time: (h.open_time || '09:00').slice(0, 5),
            close_time: (h.close_time || '19:00').slice(0, 5),
          }))
        );
        const foundPlan = plans.find((p) => p.tier === b.subscription_plan) || plans[0] || null;
        setCurrentPlan(foundPlan);
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
    setSaveError('');
    setSaveSuccessMsg('');
    setSavedMessage(false);

    if (!business) {
      setSaveError('Aktif işletme bilgisi bulunamadı, lütfen sayfayı yenileyin.');
      return;
    }

    // Eksik alan kontrolleri
    if (!name.trim()) {
      setSaveError('Eksik Bilgi: Lütfen "İşletme Adı" alanını doldurun.');
      return;
    }

    const cleanSlug = repo.normalizeSlug(slug || name);
    if (!cleanSlug) {
      setSaveError('Eksik Bilgi: Lütfen geçerli bir "Özel Bağlantı Kodu (Slug)" girin.');
      return;
    }

    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setSaveError('Eksik Bilgi: Lütfen geçerli bir "Telefon Numarası" girin (en az 10 rakam).');
      return;
    }

    if (!address.trim()) {
      setSaveError('Eksik Bilgi: Lütfen "Adres" alanını boş bırakmayın.');
      return;
    }

    setSavingSettings(true);
    try {
      const updatedBiz = await repo.updateBusiness(business.id, {
        name: name.trim(),
        slug: cleanSlug,
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        settings: {
          ...business.settings,
          slot_interval_minutes: Number(slotInterval),
          auto_confirm_appointments: autoConfirm,
          cancellation_deadline_hours: Number(cancelHours),
          loyalty_program: {
            enabled: loyaltyEnabled,
            target_appointments: Number(loyaltyTarget),
            reward_type: loyaltyRewardType,
            discount_percent: Number(loyaltyDiscount),
            reward_title: loyaltyTitle.trim(),
          },
        },
      });

      await repo.updateWorkingHours(business.id, workingHours);

      setBusiness(updatedBiz);
      setSlug(updatedBiz.slug);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('randevory-business-updated', { detail: updatedBiz }));
      }

      const okText = `✅ İşletme ayarlarınız ve "randevory.com/${updatedBiz.slug}" bağlantınız başarıyla kaydedildi!`;
      setSaveSuccessMsg(okText);
      setSavedMessage(true);
      setTimeout(() => {
        setSavedMessage(false);
        setSaveSuccessMsg('');
      }, 6000);
    } catch (err: any) {
      const rawMsg = err?.message || '';
      if (rawMsg.includes('duplicate') || rawMsg.includes('unique') || rawMsg.includes('slug')) {
        setSaveError('Hata: Bu Özel Bağlantı Kodu (Slug) başka bir işletme tarafından kullanılıyor. Lütfen farklı bir bağlantı kodu yazın.');
      } else {
        setSaveError(`Ayarlar kaydedilirken hata oluştu: ${rawMsg || 'Lütfen bilgilerinizi kontrol edin.'}`);
      }
    } finally {
      setSavingSettings(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (newPassword.length < 6) {
      setPassError('Yeni şifreniz en az 6 karakter olmalıdır.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPassError('Şifreler birbiriyle eşleşmiyor.');
      return;
    }

    setPassLoading(true);

    if (!isSupabaseConfigured()) {
      setTimeout(() => {
        setPassLoading(false);
        setPassSuccess('Şifreniz başarıyla güncellendi.');
        setNewPassword('');
        setConfirmNewPassword('');
      }, 500);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setPassError(error.message || 'Şifre güncellenemedi.');
      } else {
        setPassSuccess('Hesap şifreniz başarıyla güncellendi!');
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } catch (err: any) {
      setPassError(err.message || 'Bir hata oluştu.');
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">İşletme ve Hesap Ayarları</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            İşletme profilinizi, çalışma saatlerinizi, hesap şifrenizi ve abonelik paketinizi bu ekrandan yönetin.
          </p>
        </div>

        {savedMessage && (
          <div className="px-3.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in">
            <Check className="w-4 h-4" /> Değişiklikler kaydedildi!
          </div>
        )}
      </div>

      {/* Floating Toast Notification (Fixed Top-Center so user always sees it regardless of scroll position) */}
      {(saveSuccessMsg || saveError) && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[92%] animate-in fade-in slide-in-from-top-4">
          {saveSuccessMsg ? (
            <div className="p-4 rounded-2xl bg-emerald-600 text-white shadow-2xl border border-emerald-400 flex items-center justify-between gap-3 text-xs sm:text-sm font-bold">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setSaveSuccessMsg('')}
                className="text-white/80 hover:text-white text-xs underline shrink-0"
              >
                Kapat
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-rose-600 text-white shadow-2xl border border-rose-400 flex items-center justify-between gap-3 text-xs sm:text-sm font-bold">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{saveError}</span>
              </div>
              <button
                type="button"
                onClick={() => setSaveError('')}
                className="text-white/80 hover:text-white text-xs underline shrink-0"
              >
                Kapat
              </button>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSave} noValidate className="space-y-8">
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
                onChange={(e) => {
                  const nextName = e.target.value;
                  setName(nextName);
                  setSlug(repo.normalizeSlug(nextName));
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Özel Bağlantı Kodu (Slug) & QR Kod</label>
              <div className="flex items-center gap-2">
                <div className="flex items-center flex-1">
                  <span className="px-3 py-2 rounded-l-xl border border-r-0 border-slate-300 bg-slate-50 text-slate-500 font-mono">
                    randevory.com/
                  </span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(repo.normalizeSlug(e.target.value))}
                    className="w-full px-3 py-2 rounded-r-xl border border-slate-300 font-mono focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="px-3 py-2 rounded-xl bg-brand-50 text-brand-700 border border-brand-200 font-bold hover:bg-brand-100 transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <QrCode className="w-4 h-4" /> QR İndir
                </button>
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

        {/* Marketing & Loyalty Program (İsteğe Bağlı Gel-Kazan) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-500" />
                <h2 className="text-base font-bold text-slate-900">
                  Müşteri Sadakat Programı (Gel-Kazan)
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                  İsteğe Bağlı Pazarlama
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                Sürekli gelen sadık müşterilerinizi ödüllendirmek için kampanya açabilirsiniz. Açıp kapatmak ve ödülü belirlemek tamamen sizin kontrolünüzdedir.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-semibold text-slate-600">
                {loyaltyEnabled ? 'Program Aktif' : 'Program Kapalı'}
              </span>
              <button
                type="button"
                onClick={() => setLoyaltyEnabled(!loyaltyEnabled)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                  loyaltyEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                    loyaltyEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {loyaltyEnabled ? (
            <div className="space-y-4 animate-in fade-in duration-200 pt-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kaçıncı Randevuda Ödül Verilsin?
                  </label>
                  <select
                    value={loyaltyTarget}
                    onChange={(e) => setLoyaltyTarget(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
                  >
                    <option value={3}>Her 3. Randevuda</option>
                    <option value={5}>Her 5. Randevuda (Önerilen)</option>
                    <option value={7}>Her 7. Randevuda</option>
                    <option value={10}>Her 10. Randevuda</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ödül Türü</label>
                  <select
                    value={loyaltyRewardType}
                    onChange={(e) => setLoyaltyRewardType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="discount_percent">% İndirim</option>
                    <option value="free_service">Ücretsiz Hizmet / İkram</option>
                    <option value="custom_gift">Özel Hediye / Sürpriz</option>
                  </select>
                </div>

                {loyaltyRewardType === 'discount_percent' ? (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">İndirim Oranı (%)</label>
                    <select
                      value={loyaltyDiscount}
                      onChange={(e) => setLoyaltyDiscount(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
                    >
                      <option value={10}>%10 İndirim</option>
                      <option value={15}>%15 İndirim</option>
                      <option value={20}>%20 İndirim (Önerilen)</option>
                      <option value={25}>%25 İndirim</option>
                      <option value={50}>%50 İndirim (Yarı Fiyatına)</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Hediye / İkram Notu</label>
                    <input
                      type="text"
                      placeholder="Örn: Yanında Sakal Tıraşı Hediye"
                      value={loyaltyTitle}
                      onChange={(e) => setLoyaltyTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Müşteriye Görünecek Kampanya Başlığı
                </label>
                <input
                  type="text"
                  value={loyaltyTitle}
                  onChange={(e) => setLoyaltyTitle(e.target.value)}
                  placeholder="Örn: Her 5. randevunuzda %20 Sadakat İndirimi!"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Müşteri Ekranı Canlı Önizleme Kutusu */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs">Müşteri Randevu Ekranında Şöyle Görünecek:</div>
                  <div className="text-xs text-amber-800 mt-0.5">
                    &ldquo;🎁 <strong>{loyaltyTitle || `Her ${loyaltyTarget}. randevunuzda sadakat indirimi!`}</strong>&rdquo;
                  </div>
                  <p className="text-[11px] text-amber-700/80 mt-1">
                    Müşteri telefon numarasını girip randevularını aldıkça sistem kaçıncı randevuda olduğunu otomatik takip eder.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
              <span>Sadakat programı şu an kapalıdır. Müşterilere herhangi bir kampanya veya indirim yansıtılmaz.</span>
              <button
                type="button"
                onClick={() => setLoyaltyEnabled(true)}
                className="text-brand-600 font-semibold hover:underline shrink-0 ml-2"
              >
                Aktif Et →
              </button>
            </div>
          )}
        </div>

        {/* Weekly Working Hours */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-600" />
                Haftalık Çalışma ve Mesai Saatleri
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Müşterilerinizin randevu alabileceği açık günleri ve mesai saatlerini belirleyin.
              </p>
            </div>

            {/* Hızlı Şablonlar */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400 mr-1 hidden sm:inline">Hızlı Ayarla:</span>
              <button
                type="button"
                onClick={() => {
                  setWorkingHours((prev) =>
                    prev.map((wh) => {
                      const isWk = wh.day_of_week >= 1 && wh.day_of_week <= 5;
                      return {
                        ...wh,
                        is_open: isWk,
                        open_time: isWk ? '09:00' : wh.open_time,
                        close_time: isWk ? '19:00' : wh.close_time,
                      };
                    })
                  );
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors"
              >
                Hafta İçi (09-19)
              </button>
              <button
                type="button"
                onClick={() => {
                  setWorkingHours((prev) =>
                    prev.map((wh) => ({ ...wh, is_open: true, open_time: '09:00', close_time: '19:00' }))
                  );
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors"
              >
                7 Gün Açık
              </button>
              <button
                type="button"
                onClick={() => {
                  setWorkingHours((prev) =>
                    prev.map((wh) => (wh.day_of_week === 0 ? { ...wh, is_open: false } : wh))
                  );
                }}
                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-semibold transition-colors"
              >
                Pazarı Kapat
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {workingHours.map((wh) => (
              <div
                key={wh.day_of_week}
                className={`p-3.5 rounded-2xl border transition-all ${
                  wh.is_open
                    ? 'bg-white border-slate-200 shadow-xs'
                    : 'bg-slate-50 border-slate-100 opacity-70'
                }`}
              >
                {/* Üst Satır: Checkbox + Gün Adı + Açık/Kapalı Butonu */}
                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2.5 cursor-pointer min-w-0 select-none">
                    <input
                      type="checkbox"
                      checked={wh.is_open}
                      onChange={() => handleWorkingHourToggle(wh.day_of_week)}
                      className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 shrink-0 cursor-pointer"
                    />
                    <span
                      className={`font-bold text-sm whitespace-nowrap ${
                        wh.is_open ? 'text-slate-900' : 'text-slate-400'
                      }`}
                    >
                      {daysTurkish[wh.day_of_week]}
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() => handleWorkingHourToggle(wh.day_of_week)}
                    className={`px-3 py-1 rounded-full text-[11px] font-extrabold transition-colors shrink-0 ${
                      wh.is_open
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {wh.is_open ? '✓ Açık' : '✕ Kapalı'}
                  </button>
                </div>

                {/* Alt Satır: Saat Girişleri (Sadece gün açıkken görünür) */}
                {wh.is_open ? (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                        Açılış
                      </span>
                      <input
                        type="time"
                        value={wh.open_time}
                        onChange={(e) =>
                          handleWorkingHourChange(wh.day_of_week, 'open_time', e.target.value)
                        }
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-brand-500"
                      />
                    </div>

                    <span className="text-slate-400 font-bold self-end pb-2 px-0.5">-</span>

                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                        Kapanış
                      </span>
                      <input
                        type="time"
                        value={wh.close_time}
                        onChange={(e) =>
                          handleWorkingHourChange(wh.day_of_week, 'close_time', e.target.value)
                        }
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 text-[11px] text-slate-400 italic">
                    Tüm gün kapalı (Randevu alınamaz)
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Subscription Plan Card (Dynamic) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-brand-600" />
            Abonelik Paketi ve Lisans
          </h2>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-base">
                  {currentPlan?.name || 'Başlangıç Paketi'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                  Aktif Lisans
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {currentPlan
                  ? `${currentPlan.max_staff >= 999 ? 'Sınırsız' : currentPlan.max_staff} Personel, Aylık ${
                      currentPlan.max_appointments_per_month >= 99999 ? 'Sınırsız' : currentPlan.max_appointments_per_month
                    } Randevu`
                  : '1 Personel, Aylık 50 Randevu'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-xl font-extrabold text-slate-900">
                  {currentPlan && currentPlan.price_monthly > 0 ? `${currentPlan.price_monthly} ₺` : 'Ücretsiz'}
                </span>
                {currentPlan && currentPlan.price_monthly > 0 && (
                  <span className="text-xs text-slate-500"> / ay</span>
                )}
              </div>
              <Link
                href="/dashboard/billing"
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              >
                Planları İncele / Yükselt <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Submit Bar & Inline Status Alert */}
        <div className="space-y-3">
          {saveError && (
            <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-800 text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-sm">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {saveSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-900 text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingSettings}
              className="px-6 py-3.5 rounded-xl bg-brand-600 text-white font-bold text-xs sm:text-sm hover:bg-brand-700 transition-all flex items-center gap-2 shadow-md disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {savingSettings ? 'Ayarlar Kaydediliyor...' : 'İşletme Ayarlarını Kaydet'}
            </button>
          </div>
        </div>
      </form>

      {/* Account Security & Password Change Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-600" />
            Hesap Güvenliği ve Şifre Değiştirme
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Giriş şifrenizi buradan anında güncelleyebilirsiniz.
          </p>
        </div>

        {passError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{passError}</span>
          </div>
        )}

        {passSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{passSuccess}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Yeni Şifre</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPass ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="En az 6 karakter"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-9 pr-9 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Yeni Şifre (Tekrar)</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPass ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="Tekrar girin"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={passLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {passLoading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
            </button>
          </div>
        </form>
      </div>

      <BusinessQrModal
        businessName={name || business?.name || 'İşletme'}
        slug={slug || business?.slug || 'salon-prestij'}
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
      />
    </div>
  );
}
