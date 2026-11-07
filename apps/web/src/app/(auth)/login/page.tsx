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
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showResendButton, setShowResendButton] = useState(false);

  // 60 saniyelik SMTP cooldown sayacı
  const { cooldown, canResend, startCooldown } = useResendCooldown('login_resend', 60);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    const confirmedParam = searchParams.get('confirmed');

    if (errorParam === 'auth-code-error') {
      router.replace('/reset-password?error=expired');
      return;
    } else if (confirmedParam === 'true') {
      setSuccessMessage('E-posta adresiniz başarıyla doğrulandı! Şimdi şifrenizle giriş yapabilirsiniz.');
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

      if (data.user) {
        const { data: member } = await supabase
          .from('business_members')
          .select('business_id')
          .eq('user_id', data.user.id)
          .maybeSingle();

        const redirectTo = searchParams.get('redirectTo');
        setTimeout(() => {
          if (redirectTo) {
            router.push(redirectTo);
          } else if (member) {
            router.push('/dashboard');
          } else {
            router.push('/create-business');
          }
        }, 800);
      } else {
        setTimeout(() => {
          router.push('/dashboard');
        }, 800);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Bir hata meydana geldi.');
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

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">E-posta Adresi</label>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-brand-600 text-white font-semibold text-xs hover:bg-brand-700 transition-all shadow-md shadow-brand-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
            Henüz bir işletme hesabınız yok mu?{' '}
            <Link href="/register" className="font-bold text-brand-600 hover:underline">
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
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-500">Yükleniyor...</div>}>
      <LoginForm />
    </Suspense>
  );
}
