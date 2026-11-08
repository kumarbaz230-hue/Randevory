'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Share2, PlusSquare, Check, Sparkles, CheckCircle2 } from 'lucide-react';

/**
 * Global trigger function that can be called from any menu, header, button or setting.
 */
export function triggerPwaInstall() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('randevory-open-pwa-install'));
  }
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already running as installed standalone PWA
    const standaloneCheck =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standaloneCheck);

    // Check iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIos(isIosDevice);

    // Listen to native browser PWA install event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).__deferredPrompt = e;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Listen to our custom in-app trigger event
    const handleOpenTrigger = () => {
      const activePrompt = deferredPrompt || (window as any).__deferredPrompt;
      if (activePrompt) {
        activePrompt.prompt();
        activePrompt.userChoice.then((choice: any) => {
          if (choice.outcome === 'accepted') {
            setDeferredPrompt(null);
            (window as any).__deferredPrompt = null;
            setInstalledSuccess(true);
            setTimeout(() => setInstalledSuccess(false), 4000);
          }
        });
      } else {
        setShowModal(true);
      }
    };

    window.addEventListener('randevory-open-pwa-install', handleOpenTrigger);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('randevory-open-pwa-install', handleOpenTrigger);
    };
  }, [deferredPrompt]);

  return (
    <>
      {/* Success Notification if user completed install */}
      {installedSuccess && (
        <div className="fixed top-4 inset-x-4 z-50 max-w-md mx-auto p-4 rounded-2xl bg-emerald-600 text-white shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-6 h-6 text-emerald-200 shrink-0" />
          <div className="text-xs">
            <div className="font-bold">Uygulama Başarıyla Eklendi!</div>
            <div className="text-emerald-100">RANDEVORY artık telefonunuzun ana ekranında hazır.</div>
          </div>
        </div>
      )}

      {/* Trustworthy Step-by-Step Installation Modal (When triggered from site menus) */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in slide-in-from-bottom-6 sm:zoom-in-95 safe-bottom max-h-[90vh] overflow-y-auto">
            <div className="w-12 h-1.5 rounded-full bg-slate-300 mx-auto mb-4 sm:hidden" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">RANDEVORY Mobil Uygulaması</h3>
                  <p className="text-[11px] text-slate-500">Ana ekrandan doğrudan ve hızlı erişin</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isStandalone ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm text-slate-900">Uygulama Zaten Yüklü!</h4>
                <p className="text-xs text-slate-600 max-w-xs mx-auto">
                  RANDEVORY cihazınızda uygulama modunda sorunsuz bir şekilde çalışmaktadır.
                </p>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs mt-2"
                >
                  Tamam
                </button>
              </div>
            ) : isIos ? (
              /* iOS Safari Instructions */
              <div className="py-4 space-y-3 text-xs text-slate-700">
                <p className="text-slate-600 text-xs leading-relaxed">
                  iPhone / iPad cihazınızda Safari üzerinden uygulamayı 2 adımda ana ekranınıza ekleyebilirsiniz:
                </p>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="leading-relaxed">
                    Safari ekranının en altındaki <Share2 className="w-3.5 h-3.5 inline text-blue-600 mx-0.5" /> <strong>Paylaş</strong> butonuna dokunun.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="leading-relaxed">
                    Açılan menüde aşağı kaydırıp <PlusSquare className="w-3.5 h-3.5 inline text-slate-800 mx-0.5" /> <strong>&ldquo;Ana Ekrana Ekle&rdquo;</strong> seçeneğini seçin.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed text-[11px]">
                    Artık <strong>RANDEVORY</strong> ana ekranınızda bağımsız, reklamsız ve hızlı bir uygulama olarak çalışacaktır!
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full py-3 rounded-xl bg-brand-600 text-white font-bold text-xs shadow-sm hover:bg-brand-700 mt-2"
                >
                  Anladım, Kapat
                </button>
              </div>
            ) : (
              /* Android / Chrome / Edge Instructions */
              <div className="py-4 space-y-3 text-xs text-slate-700">
                <p className="text-slate-600 text-xs leading-relaxed">
                  Android veya tarayıcınızda uygulamayı ana ekrana eklemek için:
                </p>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-6 h-6 rounded-lg bg-brand-100 text-brand-700 font-bold flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="leading-relaxed">
                    Tarayıcınızın sağ üstündeki <strong>⋮ (üç nokta)</strong> menüsüne dokunun.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-6 h-6 rounded-lg bg-brand-100 text-brand-700 font-bold flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="leading-relaxed">
                    Menüden <Download className="w-3.5 h-3.5 inline text-brand-600 mx-0.5" /> <strong>&ldquo;Uygulamayı Yükle&rdquo;</strong> veya <strong>&ldquo;Ana Ekrana Ekle&rdquo;</strong> seçeneğine dokunun.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed text-[11px]">
                    Tek tıkla kurulum tamamlanır. İnternet kesilse bile takvim ve randevularınıza anında erişebilirsiniz.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full py-3 rounded-xl bg-brand-600 text-white font-bold text-xs shadow-sm hover:bg-brand-700 mt-2"
                >
                  Anladım, Kapat
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
