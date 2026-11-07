'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Headset,
  X,
  Send,
  ShieldAlert,
  Clock,
  Sparkles,
  Megaphone,
  MessageCircle,
  PlusCircle,
  ShieldCheck,
} from 'lucide-react';
import { buildWhatsAppUrl } from '@/lib/whatsapp-helper';

export interface SupportChatMessage {
  sender: 'user' | 'admin';
  text: string;
  created_at: string;
}

export interface SupportTicketRow {
  id: string;
  sender_name: string;
  sender_contact: string;
  category: string;
  subject: string;
  message: string;
  reported_business_slug: string | null;
  status: 'open' | 'answered' | 'closed';
  admin_reply: string | null;
  messages?: SupportChatMessage[];
  replied_at: string | null;
  created_at: string;
}

const ACTIVE_TICKET_STORAGE_KEY = 'randevory_active_support_ticket_id';

export function SupportFloatingWidget() {
  const [isOpen, setIsOpen] = useState(false);

  // Global announcement banner from platform_settings
  const [announcementActive, setAnnouncementActive] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');
  const [supportWhatsapp, setSupportWhatsapp] = useState('');
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Active Live Support Ticket (if user already started a conversation)
  const [activeTicket, setActiveTicket] = useState<SupportTicketRow | null>(null);
  const [replyInput, setReplyInput] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // New Ticket Form (shown only before starting a conversation)
  const [category, setCategory] = useState<'support' | 'complaint' | 'billing' | 'suggestion'>('support');
  const [senderName, setSenderName] = useState('');
  const [senderContact, setSenderContact] = useState('');
  const [reportedBusiness, setReportedBusiness] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchActiveTicketById = useCallback(async (ticketId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from('platform_support_tickets')
      .select('*')
      .eq('id', ticketId)
      .maybeSingle();

    if (data) {
      setActiveTicket(data as SupportTicketRow);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();

    async function loadInitial() {
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

      // Check localStorage for an existing active support chat
      const savedTicketId =
        typeof window !== 'undefined' ? localStorage.getItem(ACTIVE_TICKET_STORAGE_KEY) : null;

      if (savedTicketId) {
        await fetchActiveTicketById(savedTicketId);
      }

      // Pre-fill user info if logged in, and if no localStorage ticket, load their latest active ticket
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        const metaName =
          (authData.user.user_metadata?.full_name as string) ||
          authData.user.email?.split('@')[0] ||
          '';
        setSenderName(metaName);
        if (authData.user.email) {
          setSenderContact(authData.user.email);

          if (!savedTicketId) {
            const { data: latestTicket } = await supabase
              .from('platform_support_tickets')
              .select('*')
              .eq('sender_contact', authData.user.email)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (latestTicket && latestTicket.status !== 'closed') {
              setActiveTicket(latestTicket as SupportTicketRow);
              if (typeof window !== 'undefined') {
                localStorage.setItem(ACTIVE_TICKET_STORAGE_KEY, latestTicket.id);
              }
            }
          }
        }
      }
    }

    loadInitial();
  }, [fetchActiveTicketById]);

  // Poll active ticket every 3 seconds when widget is open so Admin replies appear immediately
  useEffect(() => {
    if (!isOpen || !activeTicket?.id) return;
    const timer = setInterval(() => {
      fetchActiveTicketById(activeTicket.id);
    }, 3000);
    return () => clearInterval(timer);
  }, [isOpen, activeTicket?.id, fetchActiveTicketById]);

  const chatMessages: SupportChatMessage[] = React.useMemo(() => {
    if (!activeTicket) return [];
    if (Array.isArray(activeTicket.messages) && activeTicket.messages.length > 0) {
      return activeTicket.messages;
    }
    const fallback: SupportChatMessage[] = [
      {
        sender: 'user',
        text: activeTicket.message,
        created_at: activeTicket.created_at,
      },
    ];
    if (activeTicket.admin_reply) {
      fallback.push({
        sender: 'admin',
        text: activeTicket.admin_reply,
        created_at: activeTicket.replied_at || activeTicket.created_at,
      });
    }
    return fallback;
  }, [activeTicket]);

  useEffect(() => {
    if (isOpen && activeTicket) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, activeTicket, chatMessages.length]);

  const handleStartSupportChat = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!senderName.trim() || !senderContact.trim() || !subject.trim() || !message.trim()) {
      setErrorMsg('Lütfen tüm zorunlu alanları doldurun.');
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const firstMessageObj: SupportChatMessage = {
        sender: 'user',
        text: message.trim(),
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('platform_support_tickets')
        .insert({
          sender_name: senderName.trim(),
          sender_contact: senderContact.trim(),
          category,
          subject: subject.trim(),
          message: message.trim(),
          messages: [firstMessageObj],
          reported_business_slug:
            category === 'complaint' && reportedBusiness.trim() ? reportedBusiness.trim() : null,
          status: 'open',
        })
        .select('*')
        .single();

      if (error) throw error;

      const created = data as SupportTicketRow;
      setActiveTicket(created);
      if (typeof window !== 'undefined') {
        localStorage.setItem(ACTIVE_TICKET_STORAGE_KEY, created.id);
      }
      setSubject('');
      setMessage('');
      setReportedBusiness('');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Destek sohbeti başlatılırken bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendFollowUpMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyInput.trim() || sendingReply) return;

    const textToSend = replyInput.trim();
    setSendingReply(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('user_send_support_message', {
        p_ticket_id: activeTicket.id,
        p_message: textToSend,
      });

      if (error) throw error;

      if (data) {
        setActiveTicket(data as SupportTicketRow);
      } else {
        await fetchActiveTicketById(activeTicket.id);
      }
      setReplyInput('');
    } catch (err: any) {
      alert(err?.message || 'Mesaj gönderilemedi.');
    } finally {
      setSendingReply(false);
    }
  };

  const handleStartNewTopic = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACTIVE_TICKET_STORAGE_KEY);
    }
    setActiveTicket(null);
    setReplyInput('');
    setErrorMsg(null);
  };

  const lastMessage = chatMessages[chatMessages.length - 1];
  const isWaitingForAdmin = activeTicket?.status !== 'closed' && lastMessage?.sender === 'user';

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

        {/* Support Modal / Live Chat Drawer */}
        {isOpen && (
          <div className="w-[360px] sm:w-[410px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-900 text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shrink-0 shadow-inner relative">
                  <Headset className="w-5 h-5 text-white" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                    RANDEVORY Canlı Destek
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    {activeTicket
                      ? `Konu: ${activeTicket.subject}`
                      : 'Yardım, Öneri & Şüpheli İşletme Bildirimi'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {activeTicket && (
                  <button
                    type="button"
                    onClick={handleStartNewTopic}
                    title="Yeni Destek Konusu Başlat"
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Yeni Konu
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body: Either Live Chat Room (if activeTicket exists) OR Start Form */}
            {activeTicket ? (
              <div className="flex flex-col h-[430px]">
                {/* Chat Messages Scroll Area */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
                  {/* Info Banner */}
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                    <span>
                      Gönderen: <strong>{activeTicket.sender_name}</strong>
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        activeTicket.status === 'closed'
                          ? 'bg-slate-200 text-slate-700'
                          : activeTicket.status === 'answered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {activeTicket.status === 'closed'
                        ? 'Görüşme Tamamlandı'
                        : activeTicket.status === 'answered'
                        ? 'Destek Ekibi Yanıtladı'
                        : 'Destek Ekibi Bekleniyor'}
                    </span>
                  </div>

                  {/* Message Bubbles */}
                  {chatMessages.map((msg, idx) => {
                    const isAdmin = msg.sender === 'admin';
                    return (
                      <div
                        key={idx}
                        className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                            isAdmin
                              ? 'bg-white border-2 border-brand-200 text-slate-900 rounded-tl-sm'
                              : 'bg-brand-600 text-white rounded-tr-sm'
                          }`}
                        >
                          {isAdmin && (
                            <div className="font-extrabold text-[10px] uppercase tracking-wider text-brand-700 flex items-center gap-1 mb-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
                              RANDEVORY Destek Ekibi
                            </div>
                          )}
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 px-1">
                          {msg.created_at
                            ? new Date(msg.created_at).toLocaleTimeString('tr-TR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </span>
                      </div>
                    );
                  })}

                  {/* Waiting Indicator when waiting for Admin reply */}
                  {isWaitingForAdmin && (
                    <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2.5 animate-pulse">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold">Destek ekibimiz mesajınızı inceliyor...</div>
                        <div className="text-amber-700 mt-0.5">
                          Bu pencereden ayrılmanıza gerek yoktur; yanıt geldiğinde otomatik olarak ekrana düşecektir.
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Bottom Reply Input Box so User can keep messaging back and forth */}
                {activeTicket.status === 'closed' ? (
                  <div className="p-3 bg-white border-t border-slate-200 text-center space-y-2">
                    <div className="text-xs text-slate-500 font-medium">
                      Bu destek görüşmesi çözümlenerek kapatılmıştır.
                    </div>
                    <button
                      type="button"
                      onClick={handleStartNewTopic}
                      className="w-full py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs"
                    >
                      Yeni Destek Sohbeti Başlat
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSendFollowUpMessage}
                    className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
                  >
                    <input
                      type="text"
                      placeholder="Destek ekibine mesajınızı yazın..."
                      value={replyInput}
                      onChange={(e) => setReplyInput(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <button
                      type="submit"
                      disabled={sendingReply || !replyInput.trim()}
                      className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 disabled:opacity-50 transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Gönder
                    </button>
                  </form>
                )}
              </div>
            ) : (
              /* Start New Support Conversation Form */
              <div className="p-4 max-h-[440px] overflow-y-auto">
                <form onSubmit={handleStartSupportChat} className="space-y-3 text-xs">
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
                    <label className="block font-bold text-slate-700 mb-1">Mesajınız *</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Size nasıl yardımcı olabiliriz? Mesajınızı yazıp canlı sohbete bağlanın..."
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
                    {submitting ? 'Sohbet Başlatılıyor...' : 'Canlı Desteğe Bağlan & Gönder'}
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
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
