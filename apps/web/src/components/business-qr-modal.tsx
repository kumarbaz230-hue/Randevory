'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Download,
  Copy,
  Check,
  Share2,
  ExternalLink,
  X,
  Sparkles,
  Printer,
} from 'lucide-react';
import Link from 'next/link';

interface BusinessQrProps {
  businessName: string;
  slug: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function useBusinessQr(slug: string, businessName: string) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const publicUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/${slug}`
      : `https://www.randevory.com/${slug}`;
  const displayUrl = `randevory.com/${slug}`;

  useEffect(() => {
    if (!slug) return;
    QRCode.toDataURL(publicUrl, {
      width: 600,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR generation error:', err));
  }, [slug, publicUrl]);

  const downloadQrOnly = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `${slug}-randevu-qr.png`;
    a.click();
  };

  const downloadPrintablePoster = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background Gradient
    const grad = ctx.createLinearGradient(0, 0, 1080, 1350);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e293b');
    grad.addColorStop(1, '#1d4ed8');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1350);

    // White Inner Card
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(90, 110, 900, 1130, 48);
    ctx.fill();

    // Top Brand Pill
    ctx.fillStyle = '#eff6ff';
    ctx.beginPath();
    ctx.roundRect(340, 170, 400, 56, 28);
    ctx.fill();

    ctx.fillStyle = '#2563eb';
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('7/24 ONLINE RANDEVU SİSTEMİ', 540, 207);

    // Business Name
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 46px system-ui, -apple-system, sans-serif';
    const cleanName = businessName.length > 30 ? businessName.slice(0, 28) + '...' : businessName;
    ctx.fillText(cleanName, 540, 300);

    // Subtitle
    ctx.fillStyle = '#64748b';
    ctx.font = '500 26px system-ui, -apple-system, sans-serif';
    ctx.fillText('Randevu almak için telefon kameranızla QR kodu okutun', 540, 355);

    // QR Code Frame
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(260, 410, 560, 560, 36);
    ctx.stroke();

    // Draw QR Image
    if (qrDataUrl) {
      const img = new Image();
      img.src = qrDataUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      ctx.drawImage(img, 290, 440, 500, 500);
    }

    // Bottom URL Box
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(190, 1020, 700, 90, 24);
    ctx.fill();

    ctx.fillStyle = '#2563eb';
    ctx.font = 'bold 32px monospace';
    ctx.fillText(displayUrl, 540, 1076);

    // Footer Credit
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 22px system-ui, -apple-system, sans-serif';
    ctx.fillText('Güvenli Randevu Altyapısı • RANDEVORY', 540, 1185);

    const posterUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = posterUrl;
    a.download = `${slug}-vitrin-afisi-qr.png`;
    a.click();
  };

  return {
    qrDataUrl,
    publicUrl,
    displayUrl,
    downloadQrOnly,
    downloadPrintablePoster,
  };
}

export function BusinessQrModal({
  businessName,
  slug,
  isOpen,
  onClose,
}: BusinessQrProps) {
  const { qrDataUrl, publicUrl, displayUrl, downloadQrOnly, downloadPrintablePoster } =
    useBusinessQr(slug, businessName);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Merhaba! ${businessName} online randevu sayfamızdan 7/24 saniyeler içinde randevu alabilirsiniz: ${publicUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-400/30 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-brand-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm">İşletme QR Kodu & Paylaşım</h3>
              <p className="text-[11px] text-slate-300 truncate max-w-[230px]">{businessName}</p>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6 text-center space-y-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Kamerayla Okut &bull; Anında Randevu Al
          </div>

          {/* QR Image Container */}
          <div className="mx-auto w-56 h-56 p-3 rounded-2xl bg-white border-2 border-slate-200 shadow-sm flex items-center justify-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`${businessName} QR Kod`}
                className="w-full h-full object-contain rounded-lg"
              />
            ) : (
              <div className="text-xs text-slate-400 animate-pulse">QR Kod Hazırlanıyor...</div>
            )}
          </div>

          {/* Link Copy Bar */}
          <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between gap-2 text-xs">
            <span className="font-mono font-bold text-slate-700 truncate pl-2">{displayUrl}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1 shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Kopyalandı
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Linki Kopyala
                </>
              )}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={downloadPrintablePoster}
              className="py-3 px-4 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition-all shadow-md shadow-brand-500/20 flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Vitrin Afişi İndir (PNG)
            </button>
            <button
              type="button"
              onClick={downloadQrOnly}
              className="py-3 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-slate-500" />
              Sadece QR İndir
            </button>
          </div>

          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            WhatsApp ile Müşterilere Paylaş
          </button>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            <strong>İpucu:</strong> &ldquo;Vitrin Afişi İndir&rdquo; butonuna tıklayarak işletmenizin kapısına, aynasına veya kasa yanına asabileceğiniz hazır tasarımı indirebilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
}

export function BusinessShareAndQrCard({
  businessName,
  slug,
}: {
  businessName: string;
  slug: string;
}) {
  const { qrDataUrl, publicUrl, displayUrl, downloadPrintablePoster } = useBusinessQr(
    slug,
    businessName
  );
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="bg-gradient-to-br from-brand-600 via-brand-700 to-blue-800 text-white p-6 rounded-2xl shadow-md">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 text-[10px] font-bold uppercase tracking-wider mb-2">
              <QrCode className="w-3 h-3" /> Link & QR Kod
            </span>
            <h3 className="font-bold text-base text-white">Özel Randevu Bağlantınız</h3>
            <p className="text-xs text-brand-100 mt-1 leading-relaxed">
              Müşterileriniz bu linkten veya QR kodu okutarak 7/24 randevu alabilir, randevularını sorgulayıp iptal edebilir ve size mesaj gönderebilir.
            </p>
          </div>

          {qrDataUrl && (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              title="QR Kodu Büyüt ve İndir"
              className="w-20 h-20 rounded-xl bg-white p-1.5 shrink-0 shadow-lg hover:scale-105 transition-transform cursor-pointer group relative"
            >
              <img
                src={qrDataUrl}
                alt="Randevu QR"
                className="w-full h-full object-contain"
              />
            </button>
          )}
        </div>

        <div className="mt-4 p-2.5 rounded-xl bg-white/10 backdrop-blur border border-white/20 text-xs font-mono break-all flex items-center justify-between gap-2">
          <span className="truncate">{displayUrl}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-[11px] font-sans font-semibold flex items-center gap-1 shrink-0 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" /> Kopyalandı
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" /> Kopyala
              </>
            )}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="py-2.5 px-3 bg-white text-brand-700 rounded-xl text-xs font-bold text-center hover:bg-brand-50 transition-colors shadow-sm flex items-center justify-center gap-1.5"
          >
            <QrCode className="w-3.5 h-3.5" /> QR Kod & Afiş
          </button>
          <Link
            href={`/${slug}`}
            target="_blank"
            className="py-2.5 px-3 bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-xl text-xs font-bold text-center transition-colors flex items-center justify-center gap-1.5"
          >
            Sayfayı Aç <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <button
          type="button"
          onClick={downloadPrintablePoster}
          className="mt-2 w-full py-2 rounded-xl bg-slate-900/40 hover:bg-slate-900/60 text-brand-100 text-[11px] font-semibold transition-colors flex items-center justify-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" /> Masaüstü / Vitrin QR Kartını İndir (PNG)
        </button>
      </div>

      <BusinessQrModal
        businessName={businessName}
        slug={slug}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
