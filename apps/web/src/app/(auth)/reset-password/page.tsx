'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { BrandLogo } from '@/components/brand-logo';
import {
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  KeyRound,
} from 'lucide-react';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifyingSession, setVerifyingSession] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setVerifyingSession(false);
      setSessionReady(true);
      return;
    }

    const supabase = createClient();
    let mounted = true;

    const verifyRecoveryLink = async () => {
      try {
        const urlError = searchParams?.get('error');
        const urlErrorDesc = searchParams?.get('error_description');
        if (urlError === 'expired' || urlError === 'access_denied') {
          if (mounted) {
            setErrorMessage(
              urlErrorDesc ||
                'Şifre sıfırlama bağlantınızın süresi dolmuş veya daha önce kullanılmış. Lütfen yeni bir bağlantı isteyin.'
            );
            setVerifyingSession(false);
          }
          return;
        }

        // 1. URL'de ?code=... varsa (PKCE akışı)
        const code = searchParams?.get('code');
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error && data?.session) {
            if (mounted) {
              setSessionReady(true);
              setUserEmail(data.session.user?.email || null);
              setVerifyingSession(false);
            }
            return;
          }
        }

        // 2. URL'de ?token_hash=...&type=... varsa (OTP / Recovery token akışı)
        const token_hash = searchParams?.get('token_hash');
        const type = (searchParams?.get('type') as any) || 'recovery';
        if (token_hash) {
          const { data, error } = await supabase.auth.verifyOtp({ token_hash, type });
          if (!error && data?.session) {
            if (mounted) {
              setSessionReady(true);
              setUserEmail(data.session.user?.email || null);
              setVerifyingSession(false);
            }
            return;
          }
        }

        // 3. URL Hash (#access_token=...&refresh_token=...&type=recovery) kontrolü
        if (typeof window !== 'undefined' && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          const hashError = hashParams.get('error_description');

          if (hashError) {
            if (mounted) {
              setErrorMessage('Şifre sıfırlama bağlantınızın süresi dolmuş veya geçersiz. Lütfen yeni bir bağlantı isteyin.');
              setVerifyingSession(false);
            }
            return;
          }

          if (accessToken && refreshToken) {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (!error && data?.session) {
              if (mounted) {
                setSessionReady(true);
                setUserEmail(data.session.user?.email || null);
                setVerifyingSession(false);
              }
              return;
            }
          }
        }

        // 4. Mevcut oturumu kontrol et (/auth/callback üzerinden gelindiyse oturum zaten açılmıştır)
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          if (mounted) {
            setSessionReady(true);
            setUserEmail(session.user.email || null);
            setVerifyingSession(false);
          }
          return;
        }

        // Kısa bir süre onAuthStateChange'i bekle
        setTimeout(async () => {
          if (!mounted) return;
          const {
            data: { session: retrySession },
          } = await supabase.auth.getSession();
          if (retrySession?.user) {
            setSessionReady(true);
            setUserEmail(retrySession.user.email || null);
          } else {
            setErrorMessage(
              'Oturum doğrulanamadı veya bağlantının süresi doldu. Lütfen e-posta adresinize yeni bir şifre sıfırlama bağlantısı gönderin.'
            );
          }
          setVerifyingSession(false);
        }, 800);
      } catch (err: any) {
        if (mounted) {
          setErrorMessage(err.message || 'Bağlantı doğrulanırken bir hata oluştu.');
          setVerifyingSession(false);
        }
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && session?.user) {
        if (mounted) {
          setSessionReady(true);
          setUserEmail(session.user.email || null);
          setErrorMessage('');
          setVerifyingSession(false);
        }
      }
    });

    verifyRecoveryLink();

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [searchParams]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (password.length < 6) {
      setErrorMessage('Yeni şifreniz en az 6 karakter uzunluğunda olmalıdır.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Girdiğiniz şifreler birbiriyle eşleşmiyor.');
      return;
    }

    setLoading(true);

    if (!isSupabaseConfigured()) {
      setTimeout(() => {
        setLoading(false);
        setSuccessMessage('Şifreniz başarıyla güncellendi! Yönlendiriliyorsunuz...');
        setTimeout(() => router.push('/dashboard'), 1500);
      }, 600);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        if (error.message.toLowerCase().includes('same_password') || error.message.toLowerCase().includes('different from the old')) {
          setErrorMessage('Yeni şifreniz eski şifrenizden farklı olmalıdır.');
        } else {
          setErrorMessage(error.message || 'Şifre güncellenirken bir hata oluştu.');
        }
        setLoading(false);
        return;
      }

      setSuccessMessage('Şifreniz başarıyla güncellendi! Hesabınıza yönlendiriliyorsunuz...');
      setLoading(false);

      // Kullanıcının işletmesi var mı kontrol et
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let targetPath = '/dashboard';
      if (user) {
        const { data: member } = await supabase
          .from('business_members')
          .select('business_id')
          .eq('user_id', user.id)
          .maybeSingle();

        targetPath = member ? '/dashboard' : '/create-business';
      }

      setTimeout(() => {
        router.push(targetPath);
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Beklenmeyen bir hata oluştu.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <BrandLogo size="lg" showSlogan={true} className="justify-center" />
        <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">
          Yeni Şifrenizi Belirleyin
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          {userEmail
            ? `${userEmail} hesabınız için güçlü bir şifre oluşturun`
            : 'Hesabınıza güvenli erişim için yeni şifrenizi girin'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          {verifyingSession ? (
            <div className="py-8 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-brand-600 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-700">
                Güvenlik bağlantınız doğrulanıyor, lütfen bekleyin...
              </p>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="mb-5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                  {!sessionReady && (
                    <div className="pt-1">
                      <Link
                        href="/forgot-password"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-600 text-white font-semibold text-xs hover:bg-rose-700 transition-colors"
                      >
                        Yeni Sıfırlama Bağlantısı İste <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {successMessage && (
                <div className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {sessionReady && (
                <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Yeni Şifre
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        placeholder="En az 6 karakter"
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
                    <label className="block font-semibold text-slate-700 mb-1">
                      Yeni Şifre (Tekrar)
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        placeholder="Yeni şifrenizi tekrar girin"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !!successMessage}
                    className="w-full mt-2 py-3 rounded-xl bg-brand-600 text-white font-semibold text-xs hover:bg-brand-700 transition-all shadow-md shadow-brand-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Şifreniz Güncelleniyor...
                      </>
                    ) : (
                      <>
                        Şifremi Güncelle ve Devam Et <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </>
          )}

          <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs">
            <Link
              href="/login"
              className="text-slate-600 hover:text-slate-900 font-semibold"
            >
              Giriş Ekranına Dön
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <RefreshCw className="w-8 h-8 text-brand-600 animate-spin" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
