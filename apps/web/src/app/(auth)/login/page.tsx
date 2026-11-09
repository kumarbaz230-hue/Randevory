'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useResendCooldown } from '@/lib/use-resend-cooldown';
import { BrandLogo } from '@/components/brand-logo';
import {
  ArrowRight,
  Lock,
  Mail,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showResendButton, setShowResendButton] = useState(false);

  // 60 saniyelik SMTP cooldown sayacı
  const { cooldown, canResend, startCooldown } = useResendCooldown('login_resend', 60);

  useEffect(() => {
    // Kayıtlı "Beni Hatırla" e-postasını yükle
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem('randevory_remember_email');
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    }

    const errorParam = searchParams.get('error');
    const confirmedParam = searchParams.get('confirmed');

    if (errorParam === 'auth-code-error') {
      router.replace('/reset-password?error=expired');
      return;
    } else if (confirmedParam === 'true') {
      setSuccessMessage('E-posta adresiniz başarıyla doğrulandı! Şimdi şifrenizle giriş yapabilirsiniz.');
    }

    // Kullanıcı zaten giriş yapmışsa otomatik olarak İşletme sayfasına yönlendir
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          const redirectTo = searchParams.get('redirectTo') || '/dashboard';
          router.replace(redirectTo);
        }
      });
    }
  }, [searchParams, router]);

  const mapSupabaseError = (msg: string) => {
    const lower = msg.toLowerCase();
    if (lower.includes('invalid login credentials')) {
      return 'E-posta adresi veya şifre hatalı. Lütfen bilgilerinizi kontrol edin.';
    }
    if (lower.includes('email not confirmed')) {
      setShowResendButton(true);
      return 'E-posta adresiniz henüz onaylanmamış. Lütfen gelen kutunuza gönderilen doğrulama bağlantısına tıklayın.';
    }
    if (
      lower.includes('rate limit') ||
      lower.includes('too many requests') ||
      lower.includes('over_email_send_rate_limit') ||
      lower.includes('security purposes')
    ) {
      return 'E-posta gönderim sınırı aşıldı. Güvenliğiniz için lütfen biraz bekledikten sonra tekrar deneyin.';
    }
    if (lower.includes('user not found')) {
      return 'Bu e-posta adresiyle kayıtlı bir hesap bulunamadı.';
    }
    return msg || 'Giriş yapılamadı. Bilgilerinizi kontrol edin.';
  };

  const handleResendConfirmation = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Lütfen onay e-postasının gönderileceği e-posta adresinizi girin.');
      return;
    }

    if (!canResend) {
      setErrorMessage(`Güvenliğiniz için lütfen ${cooldown} saniye bekleyin.`);
      return;
    }

    setResendingEmail(true);
    setErrorMessage('');
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setErrorMessage(mapSupabaseError(error.message));
      } else {
        startCooldown();
        setSuccessMessage(`Doğrulama bağlantısı ${cleanEmail} adresine tekrar gönderildi. Lütfen gelen kutunuzu kontrol edin.`);
        setShowResendButton(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Onay e-postası gönderilemedi.');
    } finally {
      setResendingEmail(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setShowResendButton(false);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    if (typeof window !== 'undefined') {
      if (rememberMe) {
        localStorage.setItem('randevory_remember_email', cleanEmail);
        localStorage.setItem('randevory_remember_me', 'true');
      } else {
        localStorage.removeItem('randevory_remember_email');
        localStorage.setItem('randevory_remember_me', 'false');
      }
    }

    if (!isSupabaseConfigured()) {
      setTimeout(() => {
        setLoading(false);
        router.push('/dashboard');
      }, 500);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        setErrorMessage(mapSupabaseError(error.message));
        setLoading(false);
        return;
      }

      setSuccessMessage('Giriş başarılı! Yönlendiriliyorsunuz...');

      const targetUrl = searchParams.get('redirectTo') || '/dashboard';
      setTimeout(() => {
        window.location.href = targetUrl;
      }, 350);
    } catch (err: any) {
      setErrorMessage(err.message || 'Bir hata meydana geldi.');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      if (!isSupabaseConfigured()) {
        router.push('/dashboard');
        return;
      }
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=/dashboard`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      });
      if (error) {
        setErrorMessage(error.message || 'Google ile giriş başlatılamadı.');
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Google ile giriş başarısız oldu.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <BrandLogo size="lg" showSlogan={true} className="justify-center" />
        <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">
          İşletme Girişi
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Randevularınızı ve işletmenizi yönetmek için oturum açın
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
              {showResendButton && (
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={resendingEmail || !canResend}
                  className="w-full mt-2 py-2 px-3 rounded-lg bg-rose-100 text-rose-800 hover:bg-rose-200 font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resendingEmail ? 'animate-spin' : ''}`} />
                  {resendingEmail
                    ? 'Gönderiliyor...'
                    : cooldown > 0
                    ? `Doğrulama E-postasını Tekrar Gönder (${cooldown}s)`
                    : 'Doğrulama E-postasını Tekrar Gönder'}
                </button>
              )}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span className="leading-relaxed">{successMessage}</span>
            </div>
          )}

          {/* Google ile Tek Tıkla Giriş */}
          <div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
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
              <span className="bg-white px-3 text-slate-400">veya e-posta ile</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">E-posta Adresi</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="ornek@isletme.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700">Şifre</label>
                <Link
                  href="/forgot-password"
                  className="text-brand-600 hover:text-brand-700 font-medium"
                >
                  Şifremi Unuttum
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
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

            {/* Beni Hatırla Seçeneği */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-xs font-medium text-slate-700">
                  Beni Hatırla (Oturumumu açık tut)
                </span>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors shadow-md shadow-brand-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
            Henüz bir işletme hesabınız yok mu?{' '}
            <Link href="/register" className="font-bold text-brand-600 hover:text-brand-700">
              Hemen Kaydolun
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm text-slate-500">Yükleniyor...</div>}>
      <LoginForm />
    </Suspense>
  );
}
