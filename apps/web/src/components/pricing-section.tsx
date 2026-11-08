'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Sparkles } from 'lucide-react';

export function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <section id="plans" className="scroll-mt-28 py-24 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>Esnaf Dostu Şeffaf Fiyatlandırma</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Şeffaf ve Esnek Paketler
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base">
            İster tek kişilik bir işletme olun ister çok personelli bir merkez; işinize en uygun paketi seçin.
          </p>

          {/* Monthly / Yearly Toggle */}
          <div className="mt-8 inline-flex items-center p-1.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-slate-900 text-white shadow'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Aylık Ödeme
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('yearly')}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                billingCycle === 'yearly'
                  ? 'bg-brand-600 text-white shadow'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Yıllık Ödeme</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                billingCycle === 'yearly' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>
                %25 İndirim
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {/* Free */}
          <div className="border border-slate-200 rounded-2xl p-6 bg-white flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
              <h3 className="font-bold text-lg text-slate-900">Ücretsiz Başlangıç</h3>
              <p className="text-xs text-slate-500 mt-1">Tek kişilik işletmeler için</p>
              <div className="mt-6 mb-6">
                <span className="text-3xl font-extrabold text-slate-900">0 ₺</span>
                <span className="text-xs text-slate-500"> / ay</span>
                <p className="text-[11px] text-slate-400 mt-1">Taahhütsüz & süresiz ücretsiz</p>
              </div>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> 1 Personel</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> 5 Hizmet Tanımı</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Aylık 50 Randevu</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Özel Randevu Linki & QR</li>
              </ul>
            </div>
            <Link
              href="/register?plan=free"
              className="mt-8 block text-center py-2.5 px-4 rounded-xl border border-slate-300 font-semibold text-sm hover:bg-slate-50 text-slate-800 transition-colors"
            >
              Hemen Başla
            </Link>
          </div>

          {/* Standard */}
          <div className="border border-slate-200 rounded-2xl p-6 bg-white flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
              <h3 className="font-bold text-lg text-slate-900">Standart</h3>
              <p className="text-xs text-slate-500 mt-1">Büyüyen küçük ekipler</p>
              <div className="mt-6 mb-6">
                {billingCycle === 'monthly' ? (
                  <>
                    <span className="text-3xl font-extrabold text-slate-900">149 ₺</span>
                    <span className="text-xs text-slate-500"> / ay</span>
                    <p className="text-[11px] text-slate-400 mt-1">Aylık faturalandırılır</p>
                  </>
                ) : (
                  <>
                    <span className="text-3xl font-extrabold text-slate-900">107 ₺</span>
                    <span className="text-xs text-slate-500"> / ay</span>
                    <p className="text-[11px] text-emerald-600 font-medium mt-1">Yıllık tek çekim 1.290 ₺</p>
                  </>
                )}
              </div>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> 3 Personel</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> 20 Hizmet Tanımı</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Aylık 300 Randevu</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> WhatsApp & Canlı Mesajlaşma</li>
              </ul>
            </div>
            <Link
              href="/register?plan=standard"
              className="mt-8 block text-center py-2.5 px-4 rounded-xl border border-slate-300 font-semibold text-sm hover:bg-slate-50 text-slate-800 transition-colors"
            >
              Paketi Seç
            </Link>
          </div>

          {/* Pro (Highlighted) */}
          <div className="border-2 border-brand-500 rounded-2xl p-6 bg-white shadow-xl shadow-brand-500/10 relative flex flex-col justify-between">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-brand-600 text-white text-xs font-semibold uppercase tracking-wider shadow-sm">
              En Çok Tercih Edilen
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">Profesyonel</h3>
              <p className="text-xs text-slate-500 mt-1">Orta ölçekli merkezler</p>
              <div className="mt-6 mb-6">
                {billingCycle === 'monthly' ? (
                  <>
                    <span className="text-3xl font-extrabold text-slate-900">299 ₺</span>
                    <span className="text-xs text-slate-500"> / ay</span>
                    <p className="text-[11px] text-slate-400 mt-1">Aylık faturalandırılır</p>
                  </>
                ) : (
                  <>
                    <span className="text-3xl font-extrabold text-slate-900">224 ₺</span>
                    <span className="text-xs text-slate-500"> / ay</span>
                    <p className="text-[11px] text-emerald-600 font-medium mt-1">Yıllık tek çekim 2.690 ₺</p>
                  </>
                )}
              </div>
              <ul className="space-y-3 text-sm text-slate-700">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" /> 10 Personel</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" /> 100 Hizmet Tanımı</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" /> Aylık 1.500 Randevu</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" /> Ciro & Finans Raporları</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" /> Özel Hatırlatma Mesajları</li>
              </ul>
            </div>
            <Link
              href="/register?plan=pro"
              className="mt-8 block text-center py-2.5 px-4 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition-colors shadow-md"
            >
              Hemen Başla
            </Link>
          </div>

          {/* Enterprise */}
          <div className="border border-slate-200 rounded-2xl p-6 bg-white flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
              <h3 className="font-bold text-lg text-slate-900">Kurumsal</h3>
              <p className="text-xs text-slate-500 mt-1">Zincir ve büyük şubeler</p>
              <div className="mt-6 mb-6">
                {billingCycle === 'monthly' ? (
                  <>
                    <span className="text-3xl font-extrabold text-slate-900">599 ₺</span>
                    <span className="text-xs text-slate-500"> / ay</span>
                    <p className="text-[11px] text-slate-400 mt-1">Aylık faturalandırılır</p>
                  </>
                ) : (
                  <>
                    <span className="text-3xl font-extrabold text-slate-900">457 ₺</span>
                    <span className="text-xs text-slate-500"> / ay</span>
                    <p className="text-[11px] text-emerald-600 font-medium mt-1">Yıllık tek çekim 5.490 ₺</p>
                  </>
                )}
              </div>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Sınırsız Personel</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Sınırsız Hizmet</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Sınırsız Randevu</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Çoklu Şube Desteği</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Özel API Erişimi</li>
              </ul>
            </div>
            <Link
              href="/register?plan=enterprise"
              className="mt-8 block text-center py-2.5 px-4 rounded-xl border border-slate-300 font-semibold text-sm hover:bg-slate-50 text-slate-800 transition-colors"
            >
              İletişime Geç
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
