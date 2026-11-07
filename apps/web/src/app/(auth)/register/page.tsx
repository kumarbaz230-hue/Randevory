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
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

      // E-posta onayı gerekiyor mu kontrol et:
      if (!data.session) {
        setRegisteredEmail(cleanEmail);
        setNeedsEmailConfirmation(true);
        setLoading(false);
        return;
      }

      // Oturum anında açıldıysa işletme kurulumuna yönlendir
      router.push('/create-business');
    } catch (err: any) {
      setErrorMessage(err.message || 'Bir hata meydana geldi.');
      setLoading(false);
    }
  };

  // E-posta Onay Bildirim Ekranı
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

            {/* Tekrar Gönder Butonu (60s Cooldown Korumalı) */}
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

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-brand-600 text-white font-semibold text-xs hover:bg-brand-700 transition-all shadow-md shadow-brand-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
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
    </div>
  );
}
