'use client';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
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
  User,
  Clock,
  CheckCheck,
  Calendar,
  Sparkles,
  Plus,
  X,
} from 'lucide-react';

function DashboardMessagesContent() {
  const searchParams = useSearchParams();
  const initialPhoneParam = searchParams.get('phone') || '';
  const initialNameParam = searchParams.get('name') || '';

  const [business, setBusiness] = useState<Business | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // New conversation modal
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [newChatPhone, setNewChatPhone] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadData = async (bizId?: string) => {
    const b = bizId ? await repo.getBusinessById(bizId) : await repo.getActiveBusiness();
    if (!b) return;
    setBusiness(b);

    const [msgs, custs, apts] = await Promise.all([
      repo.getChatMessages(b.id),
      repo.getCustomers(b.id),
      repo.getAppointments(b.id),
    ]);
    setMessages(msgs);
    setCustomers(custs);
    setAppointments(apts);
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
      }
    }
  }, [initialPhoneParam]);

  // Real-time + Polling for new messages
  useEffect(() => {
    if (!business) return;

    const interval = setInterval(() => {
      repo.getChatMessages(business.id).then((msgs) => setMessages(msgs));
    }, 4000);

    let channel: any = null;
    if (isSupabaseConfigured()) {
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
          () => {
            repo.getChatMessages(business.id).then((msgs) => setMessages(msgs));
          }
        )
        .subscribe();
    }

    return () => {
      clearInterval(interval);
      if (channel && isSupabaseConfigured()) {
        const supabase = createClient();
        supabase.removeChannel(channel);
      }
    };
  }, [business]);

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

  // Auto-select first conversation if none selected
  useEffect(() => {
    if (!selectedPhone && conversations.length > 0) {
      setSelectedPhone(conversations[0].customer_phone);
    }
  }, [conversations, selectedPhone]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.customer_phone === selectedPhone) || null,
    [conversations, selectedPhone]
  );

  // Mark messages as read when viewing active conversation
  useEffect(() => {
    if (!business || !activeConversation) return;
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
  }, [business, activeConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages.length, selectedPhone]);

  const filteredConversations = conversations.filter(
    (c) =>
      c.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.customer_phone.includes(searchQuery)
  );

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
    } catch (err: any) {
      alert(err.message || 'Mesaj gönderilemedi.');
    } finally {
      setIsSending(false);
    }
  };

  const handleStartNewChat = (e: React.FormEvent) => {
    e.preventDefault();
    const norm = repo.normalizePhone(newChatPhone);
    if (norm.length < 10) {
      alert('Lütfen geçerli bir 10-11 haneli telefon numarası girin.');
      return;
    }
    setSelectedPhone(norm);
    setShowNewChatModal(false);
  };

  const quickReplies = [
    'Merhaba! Randevunuz onaylanmıştır, sizi bekliyoruz.',
    'Tabii, randevu saatinizi istediğiniz saate güncelleyebiliriz.',
    'İşletmemizde kredi kartı ve nakit ödeme geçerlidir.',
    'Herhangi bir sorunuz olursa buradan bize yazabilirsiniz.',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Müşteri Mesajları & Canlı Sohbet</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
              Canlı
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Randevu sayfanız üzerinden müşterilerinizin gönderdiği soruları ve mesajları anlık olarak yanıtlayın.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowNewChatModal(true)}
          className="px-4 py-2.5 rounded-xl bg-brand-600 text-white font-semibold text-xs hover:bg-brand-700 transition-colors flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Müşteriye Yeni Mesaj Başlat
        </button>
      </div>

      {/* Main Split Chat Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
        {/* Left Sidebar: Conversations List */}
        <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Müşteri adı veya telefon ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[520px]">
            {filteredConversations.length === 0 ? (
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
                return (
                  <button
                    key={conv.customer_phone}
                    type="button"
                    onClick={() => setSelectedPhone(conv.customer_phone)}
                    className={`w-full p-4 text-left transition-colors flex items-start gap-3 hover:bg-slate-50 ${
                      isSelected ? 'bg-brand-50/60 border-l-4 border-l-brand-600' : ''
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-blue-500 text-white font-bold text-sm flex items-center justify-center shrink-0">
                      {conv.customer_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {conv.customer_name}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {new Date(conv.last_message_at).toLocaleTimeString('tr-TR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        0{conv.customer_phone}
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <p className="text-xs text-slate-600 truncate">
                          {conv.last_sender === 'business' && (
                            <span className="text-brand-600 font-semibold">Siz: </span>
                          )}
                          {conv.last_message}
                        </p>
                        {conv.unread_count > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-brand-600 text-white text-[10px] font-bold shrink-0">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Chat Thread */}
        <div className="lg:col-span-8 flex flex-col bg-slate-50/40">
          {!activeConversation ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                <MessageSquare className="w-7 h-7 text-slate-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">Sohbet Seçilmedi</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Sol taraftan bir müşteri sohbeti seçin veya yeni bir mesaj başlatın.
              </p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center">
                    {activeConversation.customer_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900">
                      {activeConversation.customer_name}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <a
                        href={`tel:0${activeConversation.customer_phone}`}
                        className="hover:text-brand-600 hover:underline flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" /> 0{activeConversation.customer_phone}
                      </a>
                    </div>
                  </div>
                </div>

                {customerLatestAppointment && (
                  <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-brand-600 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">
                        Son Randevu Kaydı
                      </span>
                      <span className="font-semibold text-slate-800">
                        {new Date(customerLatestAppointment.start_time).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        ({customerLatestAppointment.status === 'confirmed'
                          ? 'Onaylı'
                          : customerLatestAppointment.status === 'cancelled'
                          ? 'İptal'
                          : customerLatestAppointment.status})
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Messages Feed */}
              <div className="flex-1 p-5 overflow-y-auto space-y-3 max-h-[380px]">
                {activeConversation.messages.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-400">
                    Bu müşteriyle henüz mesaj geçmişi yok. İlk mesajı aşağıdan gönderebilirsiniz.
                  </div>
                ) : (
                  activeConversation.messages.map((msg) => {
                    const isBiz = msg.sender_type === 'business';
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isBiz ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-xs shadow-sm ${
                            isBiz
                              ? 'bg-brand-600 text-white rounded-br-none'
                              : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                          }`}
                        >
                          <div className="leading-relaxed whitespace-pre-wrap">{msg.message}</div>
                          <div
                            className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${
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

              {/* Quick Replies */}
              <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0 flex items-center gap-1 mr-1">
                  <Sparkles className="w-3 h-3 text-brand-500" /> Hazır Yanıt:
                </span>
                {quickReplies.map((qr, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSendReply(undefined, qr)}
                    className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-600 text-[11px] font-medium whitespace-nowrap transition-colors"
                  >
                    {qr}
                  </button>
                ))}
              </div>

              {/* Input Box */}
              <form
                onSubmit={(e) => handleSendReply(e)}
                className="p-4 bg-white border-t border-slate-200 flex items-center gap-2.5"
              >
                <input
                  type="text"
                  placeholder={`${activeConversation.customer_name} adlı müşteriye mesaj yazın...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || isSending}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 text-white font-semibold text-xs hover:bg-brand-700 disabled:opacity-50 transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  Gönder
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
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
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
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
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
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
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewChatModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700"
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
