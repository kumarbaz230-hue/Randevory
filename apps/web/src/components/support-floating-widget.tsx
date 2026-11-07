'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Headset,
  X,
  Send,
  ShieldAlert,
  CheckCircle2,
  Search,
  MessageSquare,
  Clock,
  Sparkles,
  Megaphone,
  MessageCircle,
} from 'lucide-react';
import { buildWhatsAppUrl } from '@/lib/whatsapp-helper';

interface SupportTicketRow {
  id: string;
  sender_name: string;
  sender_contact: string;
  category: string;
  subject: string;
  message: string;
  reported_business_slug: string | null;
  status: 'open' | 'answered' | 'closed';
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
}

export function SupportFloatingWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'new' | 'lookup'>('new');

  // Global announcement banner from platform_settings
  const [announcementActive, setAnnouncementActive] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');
  const [supportWhatsapp, setSupportWhatsapp] = useState('');
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // New Ticket Form
  const [category, setCategory] = useState<'support' | 'complaint' | 'billing' | 'suggestion'>('support');
  const [senderName, setSenderName] = useState('');
  const [senderContact, setSenderContact] = useState('');
  const [reportedBusiness, setReportedBusiness] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Lookup Form
  const [lookupContact, setLookupContact] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [myTickets, setMyTickets] = useState<SupportTicketRow[]>([]);
  const [lookupDone, setLookupDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function loadInitial() {
      // Load platform settings
      const { data: settingsData } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('id', 'global')
        .maybeSingle();

      if (settingsData) {
        setAnnouncementActive(Boolean(settingsData.announcement_active));
        setAnnouncementText(settingsData.announcement_text || '');
        setSupportWhatsapp(settingsData.support_whatsapp || '');
      }

      // Pre-fill user info if logged in
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        const metaName =
          (authData.user.user_metadata?.full_name as string) ||
          authData.user.email?.split('@')[0] ||
          '';
        setSenderName(metaName);
        if (authData.user.email) {
          setSenderContact(authData.user.email);
          setLookupContact(authData.user.email);
        }
      }
    }

    loadInitial();
  }, []);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!senderName.trim() || !senderContact.trim() || !subject.trim() || !message.trim()) {
      setErrorMsg('Lütfen zorunlu alanları doldurun.');
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('platform_support_tickets').insert({
        sender_name: senderName.trim(),
        sender_contact: senderContact.trim(),
        category,
        subject: subject.trim(),
        message: message.trim(),
        reported_business_slug: category === 'complaint' && reportedBusiness.trim() ? reportedBusiness.trim() : null,
        status: 'open',
      });

      if (error) throw error;

      setSubmitSuccess(true);
      setLookupContact(senderContact.trim());
      setSubject('');
      setMessage('');
      setReportedBusiness('');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Destek talebi gönderilirken bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLookupTickets = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!lookupContact.trim()) return;

    setLookupLoading(true);
    setLookupDone(false);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('platform_support_tickets')
        .select('*')
        .ilike('sender_contact', `%${lookupContact.trim()}%`)
        .order('created_at', { ascending: false })
        .limit(20);

      setMyTickets((data as SupportTicketRow[]) || []);
      setLookupDone(true);
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <>
      {/* Global Top Announcement Banner (if enabled by Admin) */}
      {announcementActive && announcementText && !bannerDismissed && (
        <div className="bg-gradient-to-r from-brand-700 via-indigo-700 to-slate-900 text-white px-4 py-2 text-xs font-medium relative z-[60] shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 mx-auto text-center">
              <Megaphone className="w-4 h-4 text-amber-300 shrink-0 animate-pulse" />
              <span>{announcementText}</span>
            </div>
            <button
              type="button"
              onClick={() => setBannerDismissed(true)}
              className="text-white/70 hover:text-white p-0.5 shrink-0"
              title="Duyuruyu Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Support Trigger Button */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group flex items-center gap-2.5 pl-4 pr-5 py-3 rounded-full bg-slate-900 hover:bg-brand-600 text-white shadow-2xl shadow-slate-900/30 border border-slate-700/80 transition-all hover:scale-105"
          >
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-brand-600 group-hover:bg-white group-hover:text-brand-600 transition-colors">
              <Headset className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
            </div>
            <div className="text-left">
              <div className="text-[10px] font-bold uppercase tracking-wider text-brand-300 group-hover:text-white/90 leading-none">
                7/24 Güvenlik & Yardım
              </div>
              <div className="text-xs font-extrabold leading-tight mt-0.5">
                Canlı Destek / Bildir
              </div>
            </div>
          </button>
        )}

        {/* Support Modal / Drawer */}
        {isOpen && (
          <div className="w-[350px] sm:w-[400px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shrink-0 shadow-inner">
                  <Headset className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                    RANDEVORY Destek Ekibi
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Yardım, Öneri & Şüpheli İşletme Bildirimi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 p-1 gap-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('new');
                  setSubmitSuccess(false);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'new'
                    ? 'bg-white text-brand-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Destek / Şikayet Yaz
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('lookup');
                  if (lookupContact) handleLookupTickets();
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'lookup'
                    ? 'bg-white text-brand-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                Yanıtları Sorgula
              </button>
            </div>

            {/* Body */}
            <div className="p-4 max-h-[440px] overflow-y-auto">
              {activeTab === 'new' ? (
                submitSuccess ? (
                  <div className="py-8 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <h4 className="font-extrabold text-base text-slate-900">
                      Talebiniz Destek Ekibine İletildi!
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Destek ve güvenlik ekibimiz talebinizi inceleyip en kısa sürede yanıtlayacaktır. Yanıtları <strong>&ldquo;Yanıtları Sorgula&rdquo;</strong> sekmesinden takip edebilirsiniz.
                    </p>
                    <div className="pt-2 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('lookup');
                          handleLookupTickets();
                        }}
                        className="w-full py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700"
                      >
                        Taleplerimi & Yanıtları Gör
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubmitSuccess(false)}
                        className="w-full py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50"
                      >
                        Yeni Talep Oluştur
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitTicket} className="space-y-3 text-xs">
                    {errorMsg && (
                      <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium">
                        {errorMsg}
                      </div>
                    )}

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Konu Kategorisi *</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-brand-500"
                      >
                        <option value="support">🛠️ Teknik Destek & Kullanım Yardımı</option>
                        <option value="complaint">🚨 Şüpheli / Güvenilir Olmayan İşletme Şikayeti</option>
                        <option value="billing">💳 Paketler & Abonelik İşlemleri</option>
                        <option value="suggestion">💡 Öneri & Geri Bildirim</option>
                      </select>
                    </div>

                    {category === 'complaint' && (
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5">
                        <label className="block font-bold text-amber-900 flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                          Şikayet Edilen İşletme Adı veya Linki
                        </label>
                        <input
                          type="text"
                          placeholder="Örn: randevory.com/ornek-salon"
                          value={reportedBusiness}
                          onChange={(e) => setReportedBusiness(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white text-slate-800"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Adınız Soyadınız *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ad Soyad"
                          value={senderName}
                          onChange={(e) => setSenderName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Telefon veya E-posta *</label>
                        <input
                          type="text"
                          required
                          placeholder="05XX veya E-posta"
                          value={senderContact}
                          onChange={(e) => setSenderContact(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Konu Başlığı *</label>
                      <input
                        type="text"
                        required
                        placeholder="Kısa başlık yazın..."
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Mesajınız / Açıklama *</label>
                      <textarea
                        rows={3}
                        required
                        placeholder="Size nasıl yardımcı olabiliriz? Detayları yazabilirsiniz..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {submitting ? 'Gönderiliyor...' : 'Destek Ekibine Gönder'}
                    </button>

                    {supportWhatsapp && (
                      <a
                        href={buildWhatsAppUrl(
                          supportWhatsapp,
                          'Merhaba RANDEVORY Destek Ekibi, bir konuda bilgi almak istiyorum.'
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4 text-emerald-600" />
                        WhatsApp Canlı Destek Hattı
                      </a>
                    )}
                  </form>
                )
              ) : (
                <div className="space-y-3 text-xs">
                  <form onSubmit={handleLookupTickets} className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Telefon numaranız veya E-postanız..."
                      value={lookupContact}
                      onChange={(e) => setLookupContact(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-300"
                    />
                    <button
                      type="submit"
                      disabled={lookupLoading}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 shrink-0"
                    >
                      {lookupLoading ? '...' : 'Sorgula'}
                    </button>
                  </form>

                  {lookupDone && myTickets.length === 0 && (
                    <div className="py-8 text-center text-slate-500">
                      Bu iletişim bilgisiyle oluşturulmuş bir destek talebi bulunamadı.
                    </div>
                  )}

                  <div className="space-y-2.5">
                    {myTickets.map((t) => (
                      <div
                        key={t.id}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900 truncate">{t.subject}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                              t.status === 'answered'
                                ? 'bg-emerald-100 text-emerald-800'
                                : t.status === 'closed'
                                ? 'bg-slate-200 text-slate-700'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {t.status === 'answered'
                              ? 'Yanıtlandı'
                              : t.status === 'closed'
                              ? 'Çözüldü'
                              : 'İnceleniyor'}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">{t.message}</p>
                        {t.admin_reply ? (
                          <div className="p-2.5 rounded-lg bg-brand-50 border border-brand-200 text-brand-950 space-y-1">
                            <div className="font-extrabold text-[10px] uppercase tracking-wider text-brand-700 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> RANDEVORY Destek Ekibi Yanıtı:
                            </div>
                            <p className="text-[11px] leading-relaxed">{t.admin_reply}</p>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Destek ekibimiz inceliyor, yanıtlandığında burada görünecektir.
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
