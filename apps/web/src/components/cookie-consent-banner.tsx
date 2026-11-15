'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie, ShieldCheck, Check, SlidersHorizontal, X } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'randevory_cookie_consent_v1';

interface CookieConsentState {
  necessary: boolean;
  functional: boolean;
  timestamp: string;
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [functionalEnabled, setFunctionalEnabled] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!saved) {
        const timer = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const savePreference = (functional: boolean) => {
    try {
      const payload: CookieConsentState = {
        necessary: true,
        functional,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Çerez Tercihleri"
      className="fixed bottom-3 left-3 right-16 sm:right-auto sm:bottom-5 sm:left-5 sm:max-w-md z-40 animate-in fade-in slide-in-from-bottom-4"
    >
      <div className="bg-slate-950/95 backdrop-blur-md text-white rounded-2xl border border-slate-800 shadow-2xl p-4 space-y-3">
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-400 flex items-center justify-center shrink-0">
              <Cookie className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-white leading-tight">Çerez ve Gizlilik Tercihleri</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">6698 Sayılı KVKK Uyumlu</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => savePreference(false)}
            aria-label="Yalnızca zorunlu çerezlerle kapat"
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-[11px] text-slate-300 leading-relaxed">
          Size güvenli oturum sunabilmek için <strong>zorunlu teknik çerezler</strong> kullanıyoruz. Üçüncü taraf reklam veya takip çerezi <strong>kullanmıyoruz</strong>. Detaylar için{' '}
          <Link href="/yasal#cerez" className="text-brand-300 hover:text-brand-200 underline font-semibold">
            Çerez Politikası
          </Link>
          &apos;nı inceleyebilirsiniz.
        </p>

        {showDetails && (
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-[11px]">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="font-bold text-white flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Zorunlu Teknik Çerezler
                </div>
                <div className="text-[10px] text-slate-400">Oturum güvenliği ve kimlik doğrulama</div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Her Zaman Aktif
              </span>
            </div>

            <label className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800 cursor-pointer">
              <div>
                <div className="font-bold text-white">İşlevsellik Tercihleri</div>
                <div className="text-[10px] text-slate-400">Canlı destek & bildirim tercihleri</div>
              </div>
              <input
                type="checkbox"
                checked={functionalEnabled}
                onChange={(e) => setFunctionalEnabled(e.target.checked)}
                className="w-4 h-4 rounded accent-brand-500 cursor-pointer"
              />
            </label>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className="px-2.5 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-[11px] font-semibold flex items-center gap-1 transition-colors"
          >
            <SlidersHorizontal className="w-3 h-3" />
            {showDetails ? 'Gizle' : 'Tercihler'}
          </button>

          {showDetails ? (
            <button
              type="button"
              onClick={() => savePreference(functionalEnabled)}
              className="flex-1 py-2 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-colors shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              Seçimi Kaydet
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => savePreference(false)}
                className="px-3 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-200 text-[11px] font-semibold transition-colors"
              >
                Sadece Zorunlu
              </button>
              <button
                type="button"
                onClick={() => savePreference(true)}
                className="flex-1 py-2 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-colors shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                Kabul Et
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
