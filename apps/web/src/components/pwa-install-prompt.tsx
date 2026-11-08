'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Share2, PlusSquare, Check } from 'lucide-react';

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(true);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already running as installed PWA / standalone
    const standaloneCheck =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standaloneCheck);

    // Check if iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIos(isIosDevice);

    const savedDismiss = localStorage.getItem('randevory_pwa_dismissed');
    if (savedDismiss === 'true') {
      setDismissed(true);
    }

    // Android/Desktop PWA install prompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else if (isIos) {
      setShowIosGuide(true);
    } else {
      alert('Uygulama olarak eklemek için tarayıcı menüsünden (üç nokta) "Ana Ekrana Ekle" seçeneğine dokunun.');
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('randevory_pwa_dismissed', 'true');
    }
  };

  // If already installed as app or user dismissed, don't show floating pill
  if (isStandalone || dismissed) {
    return null;
  }

  return (
    <>
      {/* Floating Bottom App Install Banner for Mobile */}
      <div className="md:hidden fixed bottom-16 left-3 right-3 z-40 animate-in slide-in-from-bottom-3 fade-in">
        <div className="p-3 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shrink-0 shadow-inner">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold truncate">Uygulama Kolaylığıyla Kullan</div>
              <div className="text-[10px] text-slate-400 truncate">Ana ekrana ekle, web sitesi gibi bekleme</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-transform"
            >
              <Download className="w-3.5 h-3.5" /> Yükle
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Kapat"
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Safari Step-by-Step Guide Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-end justify-center p-0">
          <div className="bg-white rounded-t-3xl w-full p-6 shadow-2xl animate-in slide-in-from-bottom-6 safe-bottom">
            <div className="w-12 h-1.5 rounded-full bg-slate-300 mx-auto mb-4" />
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-brand-600" />
                <h3 className="font-bold text-sm text-slate-900">iPhone Ana Ekranına Ekleme</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs text-slate-700">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                  1
                </div>
                <div className="leading-relaxed">
                  Safari ekranının en altındaki <Share2 className="w-3.5 h-3.5 inline text-blue-600" /> <strong>Paylaş</strong> butonuna dokunun.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                  2
                </div>
                <div className="leading-relaxed">
                  Açılan menüde aşağı kaydırıp <PlusSquare className="w-3.5 h-3.5 inline text-slate-800" /> <strong>&ldquo;Ana Ekrana Ekle&rdquo;</strong> seçeneğine dokunun.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  Artık <strong>RANDEVORY</strong> telefonunuzun ana ekranında bağımsız bir mobil uygulama gibi açılacaktır!
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="w-full py-3 rounded-xl bg-brand-600 text-white font-bold text-xs"
            >
              Anladım
            </button>
          </div>
        </div>
      )}
    </>
  );
}
