'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Calendar, ArrowLeft, Mail, AlertCircle, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    if (!isSupabaseConfigured()) {
      setTimeout(() => {
        setLoading(false);
        setSuccessMessage('Şifre sıfırlama talimatları e-posta adresinize gönderildi.');
      }, 500);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/settings`,
      });

      if (error) {
        if (error.message.toLowerCase().includes('rate limit')) {
          setErrorMessage('Çok fazla sıfırlama talebi yapıldı. Lütfen birkaç dakika sonra tekrar deneyin.');
        } else {
          setErrorMessage(error.message || 'Sıfırlama e-postası gönderilemedi.');
        }
        setLoading(false);
        return;
      }

      setSuccessMessage('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen gelen kutunuzu kontrol edin.');
      setLoading(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Bir hata meydana geldi.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center space-x-2">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <Calendar className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900">RANDEVO</span>
        </Link>
        <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">
          Şifrenizi mi Unuttunuz?
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Kayıtlı e-posta adresinizi girin, size şifre yenileme linki gönderelim
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
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-brand-600 text-white font-semibold text-xs hover:bg-brand-700 transition-all shadow-md shadow-brand-500/20 disabled:opacity-50"
            >
              {loading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
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
