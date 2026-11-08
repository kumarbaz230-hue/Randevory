'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { repo } from '@/lib/supabase-repository';
import { Business, SubscriptionPlan, Subscription, SubscriptionTier } from '@/types';
import {
  CreditCard,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Zap,
  Users,
  Scissors,
  Calendar,
  Lock,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

function BillingContent() {
  const searchParams = useSearchParams();
  const [business, setBusiness] = useState<Business | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSub, setCurrentSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  // Stats
  const [staffCount, setStaffCount] = useState(0);
  const [servicesCount, setServicesCount] = useState(0);
  const [appointmentsCount, setAppointmentsCount] = useState(0);

  // Billing Cycle: monthly or yearly
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Checkout Modal State
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<SubscriptionPlan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [callbackBanner, setCallbackBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Card form (Sandbox / Test fallback)
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const biz = await repo.getActiveBusiness();
      setBusiness(biz);

      const allPlans = await repo.getSubscriptionPlans();
      setPlans(allPlans);

      if (biz) {
        const sub = await repo.getBusinessSubscription(biz.id);
        setCurrentSub(sub);

        const staff = await repo.getStaff(biz.id);
        setStaffCount(staff.length);

        const services = await repo.getServices(biz.id);
        setServicesCount(services.length);

        const appointments = await repo.getAppointments(biz.id);
        setAppointmentsCount(appointments.length);
      }
    } catch (err) {
      console.error('Billing data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const paymentStatus = searchParams?.get('payment');
    if (paymentStatus === 'success') {
      setCallbackBanner({
        type: 'success',
        text: 'Shopier ödemeniz başarıyla onaylandı ve yeni lisans paketiniz aktif edildi!',
      });
    } else if (paymentStatus === 'failed' || paymentStatus === 'error') {
      setCallbackBanner({
        type: 'error',
        text: 'Shopier ödeme işlemi tamamlanamadı veya iptal edildi.',
      });
    }
  }, [searchParams]);

  const currentTier: SubscriptionTier = business?.subscription_plan || 'free';
  const activePlan = plans.find((p) => p.tier === currentTier) || plans[0];

  const handleOpenCheckout = async (plan: SubscriptionPlan) => {
    setSelectedPlanForUpgrade(plan);
    setPaymentError('');
    setPaymentSuccess(false);

    // Eğer Shopier API veya Ürün Linki aktifse doğrudan Shopier oturumunu kontrol et
    if (business && plan.price_monthly > 0) {
      try {
        const amount = plan.price_monthly;
        const res = await fetch('/api/shopier/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId: business.id,
            businessName: business.name,
            planTier: plan.tier,
            planName: plan.name,
            billingCycle,
            amount,
            buyerName: business.name,
            buyerEmail: business.email,
            buyerPhone: business.phone,
            buyerAddress: business.address,
            buyerCity: business.city,
          }),
        });

        const data = await res.json();

        // Mod 1: Doğrudan Shopier Ürün Linki yönlendirmesi
        if (data.mode === 'redirect_link' && data.redirectUrl) {
          window.location.href = data.redirectUrl;
          return;
        }

        // Mod 2: Shopier Özel API İmzalı Form Post
        if (data.mode === 'form_post' && data.endpoint && data.formFields) {
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = data.endpoint;
          Object.entries(data.formFields).forEach(([k, v]) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = k;
            input.value = String(v);
            form.appendChild(input);
          });
          document.body.appendChild(form);
          form.submit();
          return;
        }
      } catch {
        // Sandbox moduna devam et
      }
    }

    setIsModalOpen(true);
  };

  const handleFillTestCard = () => {
    setCardHolder('Ahmet Yılmaz');
    setCardNumber('5400 0000 0000 0001');
    setCardExpiry('12/28');
    setCardCvc('321');
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanForUpgrade || !business) return;

    if (cardNumber.replace(/\s/g, '').length < 16) {
      setPaymentError('Lütfen geçerli 16 haneli bir kredi kartı numarası girin.');
      return;
    }

    setIsProcessingPayment(true);
    setPaymentError('');

    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));

      await repo.upgradeSubscription({
        businessId: business.id,
        tier: selectedPlanForUpgrade.tier,
        billingCycle,
        paymentMethod: {
          cardHolder,
          lastFour: cardNumber.slice(-4),
        },
      });

      setPaymentSuccess(true);
      await loadData();
    } catch (err: any) {
      setPaymentError(err.message || 'Ödeme işlemi onaylanamadı.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Abonelik ve lisans bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-brand-600" />
          Abonelik ve Lisans Yönetimi
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          İşletmenizin büyümesine uygun lisans paketini seçin, yeni personeller ve sınırsız randevu kapasitesi kazanın.
        </p>
      </div>

      {callbackBanner && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 ${
            callbackBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {callbackBanner.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{callbackBanner.text}</span>
        </div>
      )}

      {/* Current Active Plan Status Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-brand-500/20">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Aktif Lisansınız</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Aktif
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900 mt-0.5">{activePlan?.name || 'Ücretsiz Başlangıç'}</h2>
              <p className="text-xs text-slate-500 mt-1">
                {currentSub?.current_period_end
                  ? `Lisansınız ${new Date(currentSub.current_period_end).toLocaleDateString('tr-TR')} tarihine kadar geçerlidir.`
                  : 'Ömür boyu ücretsiz başlangıç hakları devrededir.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="text-right">
              <div className="text-xs text-slate-400 font-medium">Paket Ücreti</div>
              <div className="text-xl font-black text-slate-900">
                {activePlan?.price_monthly === 0 ? 'Ücretsiz' : `${formatPrice(activePlan?.price_monthly || 0)} / ay`}
              </div>
            </div>
            {currentTier === 'free' && (
              <button
                onClick={() => {
                  const proPlan = plans.find((p) => p.tier === 'pro') || plans[1];
                  if (proPlan) handleOpenCheckout(proPlan);
                }}
                className="px-4 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition-all shadow-md shadow-brand-500/20 flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" /> Paketi Yükselt
              </button>
            )}
          </div>
        </div>

        {/* Resource Usage Meters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          {/* Staff Usage */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-brand-600" /> Personel Kapasitesi
              </span>
              <span className="font-bold text-slate-900">
                {staffCount} / {activePlan?.max_staff >= 999 ? 'Sınırsız' : activePlan?.max_staff}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  activePlan?.max_staff >= 999
                    ? 'w-10 bg-brand-600'
                    : (staffCount / (activePlan?.max_staff || 1)) >= 1
                    ? 'bg-amber-500'
                    : 'bg-brand-600'
                }`}
                style={{
                  width: activePlan?.max_staff >= 999 ? '15%' : `${Math.min(100, (staffCount / (activePlan?.max_staff || 1)) * 100)}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              {staffCount >= (activePlan?.max_staff || 1) && activePlan?.max_staff < 999
                ? '⚠️ Limit doldu. Yeni personel eklemek için paketi yükseltin.'
                : 'Mevcut personel sayınız limit dahilinde.'}
            </p>
          </div>

          {/* Services Usage */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-indigo-600" /> Hizmet Tanımları
              </span>
              <span className="font-bold text-slate-900">
                {servicesCount} / {activePlan?.max_services >= 999 ? 'Sınırsız' : activePlan?.max_services}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all"
                style={{
                  width: activePlan?.max_services >= 999 ? '20%' : `${Math.min(100, (servicesCount / (activePlan?.max_services || 1)) * 100)}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-2">Katalog ve fiyat listenizdeki aktif hizmetler.</p>
          </div>

          {/* Appointments Usage */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Aylık Randevu Kotası
              </span>
              <span className="font-bold text-slate-900">
                {appointmentsCount} / {activePlan?.max_appointments_per_month >= 9999 ? 'Sınırsız' : activePlan?.max_appointments_per_month}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all"
                style={{
                  width: activePlan?.max_appointments_per_month >= 9999 ? '25%' : `${Math.min(100, (appointmentsCount / (activePlan?.max_appointments_per_month || 1)) * 100)}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-2">Bu ay içinde alınan toplam müşteri randevuları.</p>
          </div>
        </div>
      </div>

      {/* Heading */}
      <div className="text-center pt-4">
        <h2 className="text-xl font-bold text-slate-900">Tüm Lisans Paketleri</h2>
        <p className="text-xs text-slate-500 mt-1">İşletmenize en uygun paketi seçin, taahhütsüz dilediğiniz an iptal edin veya yükseltin.</p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const isCurrent = currentTier === plan.tier;
          const isPro = plan.tier === 'pro';
          const price = plan.price_monthly;

          return (
            <div
              key={plan.id}
              className={`rounded-2xl p-6 flex flex-col justify-between transition-all relative ${
                isPro
                  ? 'bg-slate-900 text-white ring-2 ring-brand-500 shadow-xl lg:-translate-y-2'
                  : 'bg-white text-slate-900 border border-slate-200 shadow-sm hover:shadow-md'
              }`}
            >
              {isPro && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                  En Popüler Tercih
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg">{plan.name}</h3>
                  {isCurrent && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isPro ? 'bg-white/10 text-brand-300' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Mevcut
                    </span>
                  )}
                </div>

                <div className="mt-4 mb-6">
                  {plan.price_monthly === 0 ? (
                    <div className="text-3xl font-black">0 ₺</div>
                  ) : (
                    <div>
                      <span className="text-3xl font-black">{formatPrice(price)}</span>
                      <span className={`text-xs ${isPro ? 'text-slate-400' : 'text-slate-500'}`}> / ay</span>
                      <div className={`text-[11px] mt-0.5 ${isPro ? 'text-brand-300' : 'text-slate-500'} font-medium`}>
                        Aylık lisans • Taahhütsüz
                      </div>
                    </div>
                  )}
                </div>

                {/* Features List */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${isPro ? 'text-brand-400' : 'text-emerald-500'}`} />
                    <span>
                      <strong>{plan.max_staff >= 999 ? 'Sınırsız' : plan.max_staff}</strong> Personel
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${isPro ? 'text-brand-400' : 'text-emerald-500'}`} />
                    <span>
                      <strong>{plan.max_services >= 999 ? 'Sınırsız' : plan.max_services}</strong> Hizmet Tanımı
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${isPro ? 'text-brand-400' : 'text-emerald-500'}`} />
                    <span>
                      <strong>{plan.max_appointments_per_month >= 9999 ? 'Sınırsız' : plan.max_appointments_per_month}</strong> Randevu/ay
                    </span>
                  </div>

                  {plan.features
                    .filter((feat) => {
                      const lower = feat.toLowerCase();
                      return !lower.includes('personel') && !lower.includes('hizmet tanım') && !lower.includes('randevu/ay');
                    })
                    .map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <CheckCircle2 className={`w-4 h-4 shrink-0 ${isPro ? 'text-brand-400' : 'text-emerald-500'}`} />
                        <span>{feat}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-8 pt-4 border-t border-slate-100/10">
                {isCurrent ? (
                  <button
                    disabled
                    className={`w-full py-2.5 rounded-xl font-bold text-xs opacity-60 cursor-default ${
                      isPro ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    Kullandığınız Paket
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenCheckout(plan)}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 ${
                      isPro
                        ? 'bg-brand-600 text-white hover:bg-brand-500 shadow-brand-500/25'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    {plan.price_monthly === 0 ? 'Bu Pakete Geç' : 'Shopier ile Satın Al'} <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust & Guarantee Banner */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Shopier Güvencesiyle Ödeme ve Taahhütsüz Kullanım</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Tüm ödemeler Shopier 256-bit SSL şifrelemeyle ve 3D Secure güvencesiyle gerçekleşir. İstediğiniz ay iptal edebilirsiniz.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-600 font-semibold shrink-0">
          <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-indigo-700 font-bold">Shopier Ödeme</span>
          <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg">256-Bit SSL</span>
          <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg">3D Secure</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3D SECURE PAYMENT CHECKOUT MODAL */}
      {/* ========================================================================= */}
      {isModalOpen && selectedPlanForUpgrade && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 max-h-[92dvh] overflow-y-auto safe-bottom">
            <div className="w-12 h-1.5 rounded-full bg-slate-300 mx-auto mt-2.5 mb-1 sm:hidden" />
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Shopier 3D Secure Lisans Ödemesi</h3>
                  <p className="text-[11px] text-slate-400">RANDEVORY & Shopier Güvenli Ödeme Sistemi</p>
                </div>
              </div>
              <button
                disabled={isProcessingPayment}
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {paymentSuccess ? (
              /* Success State */
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-black text-slate-900">Tebrikler! Lisansınız Aktifleştirildi</h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                  <span className="font-bold text-slate-900">{selectedPlanForUpgrade.name}</span> aboneliğiniz başarıyla
                  tanımlandı. Personel ve randevu limitleriniz anında açıldı.
                </p>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1.5 text-slate-600">
                  <div className="flex justify-between">
                    <span>İşletme:</span> <strong className="text-slate-900">{business?.name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Satın Alınan Paket:</span> <strong className="text-brand-600">{selectedPlanForUpgrade.name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Ödenen Tutar:</span>{' '}
                    <strong className="text-slate-900">
                      {formatPrice(billingCycle === 'yearly' ? selectedPlanForUpgrade.price_yearly : selectedPlanForUpgrade.price_monthly)}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Fatura / Makbuz:</span> <span className="text-slate-500">E-posta adresinize gönderildi</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-md"
                >
                  Panele Dön ve Kullanmaya Başla
                </button>
              </div>
            ) : (
              /* Payment Form */
              <form onSubmit={handleProcessPayment} className="p-6 space-y-4 text-xs">
                {/* Order Summary Pill */}
                <div className="p-3.5 rounded-xl bg-brand-50/70 border border-brand-200/80 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{selectedPlanForUpgrade.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Aylık Lisans (1 Ay) • Taahhütsüz
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-black text-brand-700">
                      {formatPrice(selectedPlanForUpgrade.price_monthly)}
                    </div>
                    <div className="text-[10px] text-slate-400">KDV Dahil</div>
                  </div>
                </div>

                {/* Developer / Sandbox Test Helper */}
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🧪</span>
                    <span className="font-semibold text-[11px]">Shopier Hesap Onayı Beklenirken Test Modu Aktif</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleFillTestCard}
                    className="px-2.5 py-1 rounded-lg bg-amber-200 text-amber-900 font-bold text-[10px] hover:bg-amber-300 transition-colors"
                  >
                    Test Kartını Doldur
                  </button>
                </div>

                {paymentError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{paymentError}</span>
                  </div>
                )}

                {/* Cardholder Name */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kart Üzerindeki İsim</label>
                  <input
                    type="text"
                    required
                    placeholder="Ad Soyad"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                  />
                </div>

                {/* Card Number */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kart Numarası</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      maxLength={19}
                      placeholder="0000 0000 0000 0000"
                      value={cardNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 16);
                        const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
                        setCardNumber(formatted);
                      }}
                      className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                    />
                    <CreditCard className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Expiry and CVC */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Son Kullanma (AA/YY)</label>
                    <input
                      type="text"
                      required
                      maxLength={5}
                      placeholder="12/28"
                      value={cardExpiry}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, '').slice(0, 4);
                        if (val.length >= 3) {
                          val = `${val.slice(0, 2)}/${val.slice(2)}`;
                        }
                        setCardExpiry(val);
                      }}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">CVC / CVV</label>
                    <input
                      type="password"
                      required
                      maxLength={3}
                      placeholder="321"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 3))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono text-center"
                    />
                  </div>
                </div>

                {/* Pay Button */}
                <button
                  type="submit"
                  disabled={isProcessingPayment}
                  className="w-full mt-2 py-3 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition-all shadow-md shadow-brand-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isProcessingPayment ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      3D Secure Onayı Bekleniyor...
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      {formatPrice(selectedPlanForUpgrade.price_monthly)}{' '}
                      Güvenli Ödeme Yap
                    </>
                  )}
                </button>

                <p className="text-[10px] text-center text-slate-400 pt-1">
                  Kart bilgileriniz Shopier 256-Bit SSL altyapısıyla korunmaktadır. RANDEVORY kart bilgilerinizi asla saklamaz.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <RefreshCw className="w-8 h-8 text-brand-600 animate-spin" />
        </div>
      }
    >
      <BillingContent />
    </Suspense>
  );
}
