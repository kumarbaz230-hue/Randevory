'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useResendCooldown } from '@/lib/use-resend-cooldown';
import { BrandLogo } from '@/components/brand-logo';
import {
  ArrowRight,
  Lock,
  Mail,
  User,
  Phone,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Inbox,
  RefreshCw,
  FileText,
  ShieldCheck,
  X,
  Check,
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'kvkk' | 'terms' | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

  // Doğrulama e-postasını tekrar gönderme ve 60 saniyelik cooldown sayacı
  const { cooldown, canResend, startCooldown } = useResendCooldown('signup_resend', 60);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendStatusMessage, setResendStatusMessage] = useState('');
  const [resendErrorMessage, setResendErrorMessage] = useState('');

  const handleResendConfirmation = async () => {
    if (!registeredEmail) return;
    if (!canResend) {
      setResendErrorMessage(`Güvenliğiniz için lütfen ${cooldown} saniye bekleyin.`);
      return;
    }

    setResendingEmail(true);
    setResendStatusMessage('');
    setResendErrorMessage('');

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: registeredEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        const lower = error.message.toLowerCase();
        if (
          lower.includes('rate limit') ||
          lower.includes('too many requests') ||
          lower.includes('over_email_send_rate_limit') ||
          lower.includes('security purposes')
        ) {
          setResendErrorMessage('E-posta gönderim sınırı aşıldı. Güvenliğiniz için lütfen biraz bekledikten sonra tekrar deneyin.');
        } else {
          setResendErrorMessage(error.message || 'Onay e-postası tekrar gönderilemedi.');
        }
      } else {
        startCooldown();
        setResendStatusMessage(`Yeni onay bağlantısı ${registeredEmail} adresine iletildi. Lütfen gelen kutunuzu kontrol edin.`);
      }
    } catch (err: any) {
      setResendErrorMessage(err.message || 'Bir hata meydana geldi.');
    } finally {
      setResendingEmail(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!kvkkAccepted || !termsAccepted) {
      setErrorMessage('Kayıt olabilmek için lütfen KVKK Aydınlatma Metni ve Kullanıcı Sözleşmesini okuyup onaylayın.');
      return;
    }

    setLoading(true);

    if (password.length < 6) {
      setErrorMessage('Şifreniz en az 6 karakter olmalıdır.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Girdiğiniz şifreler birbiriyle eşleşmiyor. Lütfen kontrol edin.');
      setLoading(false);
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!isSupabaseConfigured()) {
      setTimeout(() => {
        setLoading(false);
        router.push('/create-business');
      }, 500);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
            role: 'business_owner',
            kvkk_accepted: true,
            terms_accepted: true,
            legal_accepted_at: new Date().toISOString(),
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes('already registered')) {
          setErrorMessage('Bu e-posta adresiyle kayıtlı bir hesap zaten var. Lütfen giriş yapın.');
        } else if (error.message.toLowerCase().includes('rate limit')) {
          setErrorMessage('Çok fazla kayıt denemesi yapıldı. Lütfen biraz bekleyin.');
        } else {
          setErrorMessage(error.message || 'Kayıt oluşturulamadı.');
        }
        setLoading(false);
        return;
      }

      if (!data.session) {
        setRegisteredEmail(cleanEmail);
        setNeedsEmailConfirmation(true);
        setLoading(false);
        return;
      }

      router.push('/create-business');
    } catch (err: any) {
      setErrorMessage(err.message || 'Bir hata meydana geldi.');
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      if (!isSupabaseConfigured()) {
        router.push('/create-business');
        return;
      }
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=/create-business`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      });
      if (error) {
        setErrorMessage(error.message || 'Google ile kayıt başlatılamadı.');
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Google ile işlem yapılamadı.');
      setLoading(false);
    }
  };

  if (needsEmailConfirmation) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <BrandLogo size="lg" showSlogan={true} className="justify-center" />
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
          <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-brand-600 flex items-center justify-center mx-auto mb-4">
              <Inbox className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Doğrulama E-postası Gönderildi!</h2>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              <span className="font-semibold text-slate-900">{registeredEmail}</span> adresinize bir doğrulama bağlantısı gönderdik.
            </p>

            <div className="my-5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-600 space-y-1.5">
              <div className="font-semibold text-slate-800">Sonraki Adımlar:</div>
              <div>1. E-posta gelen kutunuzu (ve gereksiz/spam klasörünü) kontrol edin.</div>
              <div>2. Size gönderilen onay bağlantısına tıklayın.</div>
              <div>3. Onay sonrasında işletmenizi tanımlamak için giriş yapın.</div>
            </div>

            {resendStatusMessage && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 text-left">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{resendStatusMessage}</span>
              </div>
            )}

            {resendErrorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{resendErrorMessage}</span>
              </div>
            )}

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={resendingEmail || !canResend}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resendingEmail ? 'animate-spin' : ''}`} />
                {resendingEmail
                  ? 'Gönderiliyor...'
                  : cooldown > 0
                  ? `Doğrulama E-postasını Tekrar Gönder (${cooldown}s)`
                  : 'Doğrulama E-postasını Tekrar Gönder'}
              </button>

              <Link
                href="/login"
                className="w-full py-3 rounded-xl bg-brand-600 text-white font-semibold text-xs hover:bg-brand-700 transition-all shadow-md shadow-brand-500/20 flex items-center justify-center gap-2"
              >
                Giriş Ekranına Git <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <BrandLogo size="lg" showSlogan={true} className="justify-center" />
        <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">
          İşletme Hesabı Oluşturun
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Dakikalar içinde randevularınızı internetten almaya başlayın
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Google ile Hızlı Kayıt */}
          <div>
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2.5 transition-colors shadow-2xs hover:border-slate-400 active:scale-98 disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Google ile Devam Et</span>
            </button>
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
              <span className="bg-white px-3 text-slate-400">veya form ile</span>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Adınız Soyadınız *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Adınız ve Soyadınız"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">E-posta Adresi *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="ornek@isletme.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Telefon Numarası *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  placeholder="0532 000 0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Şifre Belirleyin (En az 6 karakter) *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Şifre Tekrarı *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Zorunlu KVKK ve Kullanıcı Sözleşmesi Onay Kutuları */}
            <div className="pt-2 space-y-2.5 border-t border-slate-100">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={kvkkAccepted}
                  onChange={(e) => setKvkkAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 shrink-0"
                />
                <span className="text-[11px] text-slate-600 leading-relaxed">
                  <button
                    type="button"
                    onClick={() => setLegalModalType('kvkk')}
                    className="font-bold text-brand-600 hover:underline"
                  >
                    6698 Sayılı KVKK Aydınlatma Metni ve Gizlilik Politikasını
                  </button>{' '}
                  okudum, kişisel verilerimin işlenmesine açık rıza veriyorum. *
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 shrink-0"
                />
                <span className="text-[11px] text-slate-600 leading-relaxed">
                  <button
                    type="button"
                    onClick={() => setLegalModalType('terms')}
                    className="font-bold text-brand-600 hover:underline"
                  >
                    Kullanıcı Sözleşmesi, Platform Sorumluluk Sınırları ve Hizmet Şartlarını
                  </button>{' '}
                  okudum ve kabul ediyorum. *
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !kvkkAccepted || !termsAccepted}
              className="w-full mt-2 py-3 rounded-xl bg-brand-600 text-white font-semibold text-xs hover:bg-brand-700 transition-all shadow-md shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? 'Kayıt Yapılıyor...' : 'Hesap Oluştur'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
            Zaten bir hesabınız var mı?{' '}
            <Link href="/login" className="font-bold text-brand-600 hover:underline">
              Giriş Yapın
            </Link>
          </div>
        </div>
      </div>

      {/* Yasal Metin Okuma ve Onaylama Modalı */}
      {legalModalType && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                {legalModalType === 'kvkk' ? (
                  <ShieldCheck className="w-5 h-5 text-brand-400" />
                ) : (
                  <FileText className="w-5 h-5 text-brand-400" />
                )}
                <h3 className="font-bold text-sm">
                  {legalModalType === 'kvkk'
                    ? '6698 Sayılı KVKK Aydınlatma Metni ve Açık Rıza Beyanı'
                    : 'Kullanıcı Sözleşmesi ve Platform Sorumluluk Sınırları'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLegalModalType(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto text-xs text-slate-600 space-y-4 leading-relaxed">
              {legalModalType === 'kvkk' ? (
                <>
                  <p>
                    <strong>1. Veri Sorumlusu ve Veri İşleyen Sıfatı:</strong> 6698 sayılı Kişisel Verilerin Korunması Kanunu (&ldquo;KVKK&rdquo;) uyarınca; platforma üye olan İşletme Sahiplerinin üyelik verileri bakımından <strong>RANDEVORY</strong> Veri Sorumlusudur. Üye işletmelerin kendi müşterilerine ait kaydettiği veya müşterilerin randevu alırken paylaştığı veriler bakımından ise <strong>ilgili İşletme &ldquo;Veri Sorumlusu&rdquo;</strong>, RANDEVORY ise yalnızca teknik altyapı sağlayan <strong>&ldquo;Veri İşleyen&rdquo;</strong> konumundadır.
                  </p>
                  <p>
                    <strong>2. İşlenen Kişisel Veriler ve Amaçları:</strong> Ad, soyad, telefon numarası, e-posta adresi, işletme bilgileri ve işlem güvenliği kayıtlarınız; üyelik oluşturulması, kimlik doğrulaması, randevu takviminin yürütülmesi, bildirimlerin gönderilmesi ve yasal yükümlülüklerin yerine getirilmesi amacıyla işlenmektedir.
                  </p>
                  <p>
                    <strong>3. Üye İşletmenin KVKK Yükümlülüğü:</strong> Üye İşletme, RANDEVORY paneli üzerinden eriştiği müşteri iletişim ve randevu bilgilerini yalnızca randevu hizmetinin sunulması amacıyla kullanmayı, müşterilerin açık rızası olmaksızın üçüncü kişilerle paylaşmamayı ve KVKK mevzuatına tam uyum sağlamayı kabul ve taahhüt eder.
                  </p>
                  <p>
                    <strong>4. Veri Güvenliği ve Haklarınız:</strong> Kişisel verileriniz 256-bit SSL şifreli bulut altyapısında korunur ve üçüncü şahıslara pazarlama amacıyla asla satılmaz. KVKK Madde 11 kapsamındaki tüm taleplerinizi <code>noreply@randevory.com</code> adresine iletebilirsiniz.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <strong>1. Platformun Hukuki Konumu (Teknik Altyapı Sağlayıcı):</strong> <strong>RANDEVORY</strong>, randevulu çalışan işletmelerin kendi takvim, personel ve hizmetlerini yönetmelerini sağlayan bulut tabanlı bir yazılım altyapısıdır (SaaS). RANDEVORY, üye işletmelerin sunduğu hizmetlerin satıcısı, sağlayıcısı veya ortağı değildir.
                  </p>
                  <p>
                    <strong>2. Sorumluluk Reddi:</strong> İşletmenin müşterilerine sunduğu hizmetlerin kalitesi, güvenliği, fiyatlandırması, randevu iptalleri, müşteri ile işletme arasındaki ücret tahsilatı, vergi/fatura yükümlülükleri ve doğabilecek her türlü tüketici uyuşmazlığında <strong>tek muhatap ve sorumlu ilgili İşletmedir</strong>. RANDEVORY, işletme ile müşteri arasındaki uyuşmazlıklarda hiçbir hukuki, cezai veya mali sorumluluk kabul etmez.
                  </p>
                  <p>
                    <strong>3. İçerik ve Kullanım Şartları:</strong> İşletme sahibi, oluşturduğu işletme sayfasındaki tüm bilgilerin doğruluğundan ve yürürlükteki mevzuata uygunluğundan bizzat sorumludur. Yasa dışı veya yanıltıcı kullanım tespit edildiğinde RANDEVORY hesabı askıya alma hakkına sahiptir.
                  </p>
                  <p>
                    <strong>4. Lisans ve İptal Şartları:</strong> Yazılım abonelik paketleri taahhütsüzdür; dilediğiniz dönem sonlandırabilirsiniz. Ödemeler Shopier 3D Secure güvenli ödeme altyapısı üzerinden tahsil edilir.
                  </p>
                </>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <Link
                href="/yasal"
                target="_blank"
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Tüm Yasal Metinleri Yeni Sekmede Aç &rarr;
              </Link>
              <button
                type="button"
                onClick={() => {
                  if (legalModalType === 'kvkk') setKvkkAccepted(true);
                  if (legalModalType === 'terms') setTermsAccepted(true);
                  setLegalModalType(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Check className="w-4 h-4" /> Okudum, Anladım ve Onaylıyorum
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
