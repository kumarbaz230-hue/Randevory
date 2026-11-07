'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { useResendCooldown } from '@/lib/use-resend-cooldown';
import { BrandLogo } from '@/components/brand-logo';
import { ArrowLeft, Mail, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 60 saniyelik SMTP cooldown koruması
  const { cooldown, canResend, startCooldown } = useResendCooldown('forgot_resend', 60);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Lütfen e-posta adresinizi girin.');
      return;
    }

    if (!canResend) {
      setErrorMessage(`Güvenliğiniz için lütfen ${cooldown} saniye bekleyin.`);
      return;
    }

    startCooldown();
    setLoading(true);

    if (!isSupabaseConfigured()) {
      setTimeout(() => {
        setLoading(false);
        setSuccessMessage('Şifre sıfırlama talimatları e-posta adresinize gönderildi.');
      }, 500);
      return;
    }

    try {
      // PKCE code_verifier çerez uyuşmazlığını (bad_code_verifier) tamamen önlemek için
      // şifre sıfırlama isteğini implicit flow ile gönderiyoruz. Böylece farklı sekme,
      // www / non-www veya farklı cihazdan tıklandığında bile %100 sorunsuz açılır.
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      const recoveryClient = createSupabaseJsClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          flowType: 'implicit',
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      });

      const { error } = await recoveryClient.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        const lower = error.message.toLowerCase();
        if (
          lower.includes('rate limit') ||
          lower.includes('too many requests') ||
          lower.includes('over_email_send_rate_limit') ||
          lower.includes('security purposes')
        ) {
          setErrorMessage('E-posta gönderim sınırı aşıldı. Güvenliğiniz için lütfen biraz bekledikten sonra tekrar deneyin.');
        } else {
          setErrorMessage(error.message || 'Sıfırlama e-postası gönderilemedi.');
        }
        setLoading(false);
        return;
      }

      startCooldown();
      setSuccessMessage(
        'Yeni şifre sıfırlama bağlantısı e-posta adresinize gönderildi! Lütfen gelen kutunuzdaki EN SON gelen e-postadaki bağlantıya tıklayın.'
      );
      setLoading(false);
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
          Şifrenizi mi Unuttunuz?
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Kayıtlı e-posta adresinizi girin, size şifre yenileme bağlantısı gönderelim
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

          {successMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleReset} className="space-y-4 text-xs">
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

            <button
              type="submit"
              disabled={loading || !canResend}
              className="w-full mt-2 py-3 rounded-xl bg-brand-600 text-white font-semibold text-xs hover:bg-brand-700 transition-all shadow-md shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Gönderiliyor...
                </>
              ) : cooldown > 0 ? (
                `Sıfırlama Bağlantısı Gönder (${cooldown}s)`
              ) : (
                'Sıfırlama Bağlantısı Gönder'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Giriş Ekranına Dön
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
