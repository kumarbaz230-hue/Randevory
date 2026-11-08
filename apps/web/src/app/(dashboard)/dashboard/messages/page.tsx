'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { repo } from '@/lib/supabase-repository';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  Business,
  ChatMessage,
  ChatConversation,
  Customer,
  Appointment,
} from '@/types';
import {
  MessageSquare,
  Send,
  Search,
  Phone,
  CheckCheck,
  Calendar,
  Sparkles,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Navigation,
} from 'lucide-react';
import { getBusinessMapsUrl, hasMapLink, extractUrl } from '@/lib/location-helper';

const isDesktop = () =>
  typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;

function DashboardMessagesContent() {
  const searchParams = useSearchParams();
  const initialPhoneParam = searchParams.get('phone') || '';
  const initialNameParam = searchParams.get('name') || '';

  const [business, setBusiness] = useState<Business | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string>('');
  // Telefonda: true ise sohbet tam ekran açık, false ise sadece sohbet listesi görünür
  const [chatOpen, setChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showQuick, setShowQuick] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // New conversation modal
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [newChatPhone, setNewChatPhone] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadData = async (bizId?: string) => {
    const b = bizId ? await repo.getBusinessById(bizId) : await repo.getActiveBusiness();
    if (!b) {
      setLoaded(true);
      return;
    }
    setBusiness(b);

    const [msgs, custs, apts] = await Promise.all([
      repo.getChatMessages(b.id),
      repo.getCustomers(b.id),
      repo.getAppointments(b.id),
    ]);
    setMessages(msgs);
    setCustomers(custs);
    setAppointments(apts);
    setLoaded(true);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle query param ?phone=...
  useEffect(() => {
    if (initialPhoneParam) {
      const norm = repo.normalizePhone(initialPhoneParam);
      if (norm.length >= 10) {
        setSelectedPhone(norm);
        setChatOpen(true);
      }
    }
  }, [initialPhoneParam]);

  const refreshMessages = useCallback(() => {
    if (!business) return;
    if (typeof document !== 'undefined' && document.hidden) return; // sekme arka plandaysa boşuna sorgulama
    repo.getChatMessages(business.id).then((msgs) => setMessages(msgs));
  }, [business]);

  // Canlı güncelleme: realtime varsa seyrek yedek kontrol, yoksa 5 sn
  useEffect(() => {
    if (!business) return;

    const realtime = isSupabaseConfigured();
    const interval = setInterval(refreshMessages, realtime ? 20000 : 5000);

    let channel: any = null;
    if (realtime) {
      const supabase = createClient();
      channel = supabase
        .channel(`biz-chat-${business.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'chat_messages',
            filter: `business_id=eq.${business.id}`,
          },
          () => refreshMessages()
        )
        .subscribe();
    }

    const onVisible = () => {
      if (!document.hidden) refreshMessages();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      if (channel && realtime) {
        const supabase = createClient();
        supabase.removeChannel(channel);
      }
    };
  }, [business, refreshMessages]);

  // Group messages into conversations
  const conversations = useMemo(() => {
    const map = new Map<string, ChatConversation>();

    for (const msg of messages) {
      const phone = repo.normalizePhone(msg.customer_phone);
      if (!phone) continue;

      const existing = map.get(phone);
      const isUnreadFromCustomer = msg.sender_type === 'customer' && !msg.is_read;

      if (!existing) {
        map.set(phone, {
          customer_phone: phone,
          customer_name: msg.customer_name || 'Müşteri',
          last_message: msg.message,
          last_message_at: msg.created_at,
          last_sender: msg.sender_type,
          unread_count: isUnreadFromCustomer ? 1 : 0,
          messages: [msg],
        });
      } else {
        existing.messages.push(msg);
        existing.last_message = msg.message;
        existing.last_message_at = msg.created_at;
        existing.last_sender = msg.sender_type;
        if (msg.customer_name && msg.customer_name !== 'Müşteri') {
          existing.customer_name = msg.customer_name;
        }
        if (isUnreadFromCustomer) {
          existing.unread_count += 1;
        }
      }
    }

    // If URL param or manual selection opened a conversation that has no messages yet
    if (selectedPhone && !map.has(selectedPhone)) {
      const matchedCust = customers.find(
        (c) => repo.normalizePhone(c.phone) === selectedPhone
      );
      const matchedApt = appointments.find(
        (a) => repo.normalizePhone(a.customer_phone) === selectedPhone
      );
      map.set(selectedPhone, {
        customer_phone: selectedPhone,
        customer_name:
          initialNameParam ||
          matchedCust?.full_name ||
          matchedApt?.customer_name ||
          newChatName ||
          'Müşteri',
        last_message: 'Henüz mesaj yok',
        last_message_at: new Date().toISOString(),
        last_sender: 'business',
        unread_count: 0,
        messages: [],
      });
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
    );
  }, [messages, selectedPhone, customers, appointments, initialNameParam, newChatName]);

  // Bilgisayarda ilk sohbeti otomatik seç; telefonda liste açık kalsın (kullanıcı dokununca açılır)
  useEffect(() => {
    if (!selectedPhone && conversations.length > 0 && isDesktop()) {
      setSelectedPhone(conversations[0].customer_phone);
    }
  }, [conversations, selectedPhone]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.customer_phone === selectedPhone) || null,
    [conversations, selectedPhone]
  );

  const totalUnread = useMemo(
    () => conversations.reduce((sum, c) => sum + c.unread_count, 0),
    [conversations]
  );

  // Açık sohbetteki mesajları okundu işaretle (sadece sohbet gerçekten görünürken)
  useEffect(() => {
    if (!business || !activeConversation) return;
    if (!chatOpen && !isDesktop()) return;
    if (activeConversation.unread_count > 0) {
      repo.markMessagesAsRead(business.id, activeConversation.customer_phone, 'business').then(() => {
        setMessages((prev) =>
          prev.map((m) =>
            repo.normalizePhone(m.customer_phone) === activeConversation.customer_phone &&
            m.sender_type === 'customer'
              ? { ...m, is_read: true }
              : m
          )
        );
      });
    }
  }, [business, activeConversation, chatOpen]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages.length, selectedPhone, chatOpen]);

  const filteredConversations = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) => c.customer_name.toLowerCase().includes(q) || c.customer_phone.includes(searchQuery)
    );
  }, [conversations, searchQuery]);

  // Active customer's latest appointment info
  const customerLatestAppointment = useMemo(() => {
    if (!selectedPhone) return null;
    const custApts = appointments
      .filter((a) => repo.normalizePhone(a.customer_phone) === selectedPhone)
      .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
    return custApts[0] || null;
  }, [appointments, selectedPhone]);

  const handleSendReply = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = (customText ?? replyText).trim();
    if (!business || !activeConversation || !textToSend || isSending) return;

    setIsSending(true);
    try {
      const sent = await repo.sendChatMessage({
        business_id: business.id,
        customer_phone: activeConversation.customer_phone,
        customer_name: activeConversation.customer_name,
        sender_type: 'business',
        message: textToSend,
      });
      setMessages((prev) => [...prev, sent]);
      if (!customText) setReplyText('');
      setShowQuick(false);
    } catch (err: any) {
      alert(err.message || 'Mesaj gönderilemedi.');
    } finally {
      setIsSending(false);
    }
  };

  const handleShareLocation = async () => {
    if (!business || !activeConversation) return;
    const mapsUrl = getBusinessMapsUrl(business);
    const locMsg = `📍 İşletme Konumumuz:\n${business.name} – ${business.address}${business.city ? ', ' + business.city : ''}\n🗺️ Yol Tarifi Al: ${mapsUrl}`;
    await handleSendReply(undefined, locMsg);
  };

  const handleStartNewChat = (e: React.FormEvent) => {
    e.preventDefault();
    const norm = repo.normalizePhone(newChatPhone);
    if (norm.length < 10) {
      alert('Lütfen geçerli bir 10-11 haneli telefon numarası girin.');
      return;
    }
    setSelectedPhone(norm);
    setChatOpen(true);
    setShowNewChatModal(false);
  };

  const openConversation = (phone: string) => {
    setSelectedPhone(phone);
    setChatOpen(true);
    setShowQuick(false);
  };

  const quickReplies = [
    'Merhaba! Randevunuz onaylanmıştır, sizi bekliyoruz.',
    'Tabii, randevu saatinizi istediğiniz saate güncelleyebiliriz.',
    'İşletmemizde kredi kartı ve nakit ödeme geçerlidir.',
    'Herhangi bir sorunuz olursa buradan bize yazabilirsiniz.',
  ];

  const statusText = (s: string) =>
    s === 'confirmed' ? 'Onaylı' : s === 'cancelled' ? 'İptal' : s === 'pending' ? 'Onay Bekliyor' : s === 'completed' ? 'Tamamlandı' : s;

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header: telefonda sohbet açıkken gizlenir (daha çok yer kalsın) */}
      <div
        className={`${
          chatOpen ? 'hidden lg:flex' : 'flex'
        } items-center justify-between gap-3 bg-white p-4 lg:p-6 rounded-2xl border border-slate-200 shadow-sm`}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg lg:text-xl font-bold text-slate-900 truncate">Mesajlar</h1>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold shrink-0">
              Canlı
            </span>
            {totalUnread > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold shrink-0">
                {totalUnread} yeni
              </span>
            )}
          </div>
          <p className="hidden sm:block text-xs text-slate-500 mt-0.5">
            Randevu sayfanız üzerinden müşterilerinizin gönderdiği mesajları anlık yanıtlayın.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowNewChatModal(true)}
          aria-label="Yeni mesaj başlat"
          className="px-3 lg:px-4 py-2.5 rounded-xl bg-brand-600 text-white font-semibold text-xs hover:bg-brand-700 transition-colors flex items-center gap-1.5 shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Yeni Mesaj</span>
        </button>
      </div>

      {/* Ana konteyner: telefonda tek panel (liste VEYA sohbet), bilgisayarda yan yana */}
      <div
        className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 grid-rows-[minmax(0,1fr)] lg:grid-rows-none ${
          chatOpen
            ? 'h-[calc(100dvh-8.5rem)] lg:h-auto'
            : 'min-h-[320px]'
        } lg:min-h-[600px]`}
      >
        {/* Sol: Sohbet listesi */}
        <div
          className={`${
            chatOpen ? 'hidden lg:flex' : 'flex'
          } lg:col-span-4 lg:border-r border-slate-200 flex-col min-h-0`}
        >
          <div className="p-3 border-b border-slate-200 bg-slate-50/50">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Müşteri adı veya telefon ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 lg:max-h-[520px]">
            {!loaded ? (
              <div className="p-6 space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-11 h-11 rounded-full bg-slate-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/2 rounded bg-slate-200" />
                      <div className="h-3 w-3/4 rounded bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-medium text-slate-600">Henüz mesajlaşma bulunmuyor</p>
                <p className="text-[11px] text-slate-400">
                  Müşterileriniz randevu sayfanızdaki &ldquo;İşletmeye Mesaj Gönder&rdquo; butonundan yazdığında burada görünür.
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = conv.customer_phone === selectedPhone;
                const hasUnread = conv.unread_count > 0;
                return (
                  <button
                    key={conv.customer_phone}
                    type="button"
                    onClick={() => openConversation(conv.customer_phone)}
                    className={`w-full px-4 py-3.5 text-left transition-colors flex items-center gap-3 hover:bg-slate-50 active:bg-slate-100 ${
                      isSelected ? 'lg:bg-brand-50/60 lg:border-l-4 lg:border-l-brand-600' : ''
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-brand-600 to-blue-500 text-white font-bold text-sm flex items-center justify-center">
                        {conv.customer_name.charAt(0).toUpperCase()}
                      </div>
                      {hasUnread && (
                        <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-rose-500 ring-2 ring-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm truncate ${hasUnread ? 'font-extrabold text-slate-900' : 'font-semibold text-slate-800'}`}>
                          {conv.customer_name}
                        </span>
                        <span className={`text-[11px] shrink-0 ${hasUnread ? 'text-brand-600 font-bold' : 'text-slate-400'}`}>
                          {new Date(conv.last_message_at).toLocaleTimeString('tr-TR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className={`text-xs truncate ${hasUnread ? 'text-slate-800 font-semibold' : 'text-slate-500'}`}>
                          {conv.last_sender === 'business' && (
                            <span className="text-brand-600 font-semibold">Siz: </span>
                          )}
                          {conv.last_message}
                        </p>
                        {hasUnread ? (
                          <span className="min-w-5 h-5 px-1.5 rounded-full bg-brand-600 text-white text-[10px] font-bold shrink-0 flex items-center justify-center">
                            {conv.unread_count}
                          </span>
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 lg:hidden" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Sağ: Açık sohbet (Telefonda WhatsApp/Telegram gibi tam ekran, masaüstünde sağ kolon) */}
        <div
          className={`${
            chatOpen
              ? 'fixed inset-0 z-50 flex lg:relative lg:inset-auto lg:z-auto'
              : 'hidden lg:flex'
          } lg:col-span-8 flex-col bg-white min-h-0 animate-in fade-in duration-150`}
        >
          {!activeConversation ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                <MessageSquare className="w-7 h-7 text-slate-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">Sohbet Seçilmedi</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Listeden bir müşteri sohbeti seçin veya yeni bir mesaj başlatın.
              </p>
            </div>
          ) : (
            <>
              {/* Sohbet başlığı (kompakt) */}
              <div className="px-3 py-2.5 lg:p-4 bg-white border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      setChatOpen(false);
                      setSelectedPhone('');
                    }}
                    aria-label="Sohbet listesine dön"
                    className="lg:hidden p-2 -ml-1 rounded-xl text-slate-600 hover:bg-slate-100 active:bg-slate-200 shrink-0"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {activeConversation.customer_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-slate-900 truncate">
                      {activeConversation.customer_name}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      0{activeConversation.customer_phone}
                      {customerLatestAppointment && (
                        <span className="text-slate-400">
                          {' · '}
                          {new Date(customerLatestAppointment.start_time).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          ({statusText(customerLatestAppointment.status)})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <a
                  href={`tel:0${activeConversation.customer_phone}`}
                  aria-label="Müşteriyi ara"
                  className="shrink-0 w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center hover:bg-emerald-100"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>

              {/* Mesaj akışı */}
              <div className="flex-1 min-h-0 p-3 lg:p-5 overflow-y-auto space-y-2.5 lg:max-h-[380px]">
                {activeConversation.messages.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-400">
                    Bu müşteriyle henüz mesaj geçmişi yok. İlk mesajı aşağıdan gönderebilirsiniz.
                  </div>
                ) : (
                  activeConversation.messages.map((msg) => {
                    const isBiz = msg.sender_type === 'business';
                    return (
                      <div key={msg.id} className={`flex ${isBiz ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-3.5 py-2 text-[13px] shadow-sm ${
                            isBiz
                              ? 'bg-brand-600 text-white rounded-br-md'
                              : 'bg-white text-slate-800 border border-slate-200 rounded-bl-md'
                          }`}
                        >
                          <div className="leading-relaxed whitespace-pre-wrap break-words">{msg.message}</div>

                          {/* Harita / Konum Kartı */}
                          {hasMapLink(msg.message) && (
                            <div className="mt-2.5 pt-2 border-t border-black/10">
                              <a
                                href={extractUrl(msg.message) || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                                  isBiz
                                    ? 'bg-white text-brand-700 hover:bg-slate-100'
                                    : 'bg-brand-600 text-white hover:bg-brand-700'
                                }`}
                              >
                                <Navigation className="w-3.5 h-3.5" />
                                Haritada Aç / Yol Tarifi Al &rarr;
                              </a>
                            </div>
                          )}

                          <div
                            className={`text-[10px] mt-0.5 flex items-center justify-end gap-1 ${
                              isBiz ? 'text-brand-100' : 'text-slate-400'
                            }`}
                          >
                            <span>
                              {new Date(msg.created_at).toLocaleTimeString('tr-TR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isBiz && <CheckCheck className="w-3 h-3" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Hazır yanıtlar: tek tuşla açılır/kapanır */}
              {showQuick && (
                <div className="px-3 py-2 bg-white border-t border-slate-100 flex flex-col gap-1.5 shrink-0">
                  {quickReplies.map((qr, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSendReply(undefined, qr)}
                      className="w-full text-left px-3 py-2 rounded-xl bg-slate-50 hover:bg-brand-50 hover:text-brand-700 text-slate-700 text-xs font-medium transition-colors"
                    >
                      {qr}
                    </button>
                  ))}
                </div>
              )}

              {/* Yazma kutusu */}
              <form
                onSubmit={(e) => handleSendReply(e)}
                className="p-2.5 lg:p-4 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0 safe-bottom"
              >
                <button
                  type="button"
                  onClick={() => setShowQuick((v) => !v)}
                  aria-label="Hazır yanıtlar"
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
                    showQuick
                      ? 'bg-brand-50 text-brand-600 border-brand-200'
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleShareLocation}
                  title="Müşteriye İşletme Konumunu Gönder"
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-slate-200 bg-slate-50 text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  placeholder="Mesaj yazın..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 min-w-0 px-4 py-2.5 rounded-full border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || isSending}
                  aria-label="Gönder"
                  className="w-10 h-10 lg:w-auto lg:px-5 rounded-full lg:rounded-xl bg-brand-600 text-white font-semibold text-xs hover:bg-brand-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5 shrink-0 shadow-sm"
                >
                  <Send className="w-4 h-4 lg:w-3.5 lg:h-3.5" />
                  <span className="hidden lg:inline">Gönder</span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="font-bold text-base text-slate-900">Müşteriye Mesaj Başlat</h3>
              <button
                type="button"
                onClick={() => setShowNewChatModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStartNewChat} className="py-4 space-y-4 text-xs">
              {customers.length > 0 && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kayıtlı Müşterilerden Seç (Opsiyonel)
                  </label>
                  <select
                    onChange={(e) => {
                      const c = customers.find((x) => x.id === e.target.value);
                      if (c) {
                        setNewChatName(c.full_name);
                        setNewChatPhone(c.phone);
                      }
                    }}
                    defaultValue=""
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300"
                  >
                    <option value="" disabled>
                      Rehberden müşteri seçin...
                    </option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name} ({c.phone})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Müşteri Adı Soyadı *</label>
                <input
                  type="text"
                  required
                  placeholder="Ad Soyad"
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Telefon Numarası *</label>
                <input
                  type="tel"
                  required
                  placeholder="0532 000 0000"
                  value={newChatPhone}
                  onChange={(e) => setNewChatPhone(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewChatModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700"
                >
                  Sohbeti Aç
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardMessagesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Yükleniyor...</div>}>
      <DashboardMessagesContent />
    </Suspense>
  );
}
