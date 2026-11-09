'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { solveSupportQuery, SUPPORT_AGENTS, SupportAgent, formatConversationalAgentReply } from '@/lib/support-ai-brain';
import {
  Headset,
  X,
  Send,
  Clock,
  Megaphone,
  PlusCircle,
  ShieldCheck,
  Bot,
  Sparkles,
  ImagePlus,
  CheckCircle2,
  RotateCcw,
  UserCheck,
  ChevronRight,
} from 'lucide-react';

export interface SupportChatMessage {
  sender: 'user' | 'admin' | 'ai';
  text: string;
  image_url?: string | null;
  created_at: string;
  options?: Array<{ id: string; label: string }>;
  showEscalationButtons?: boolean;
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

const ACTIVE_TICKET_STORAGE_KEY = 'randevory_live_support_v3';

const MAIN_AI_CHOICES = [
  { id: 'menu_app_error', label: '🛠️ Sitede / Uygulamada Hata Alıyorum' },
  { id: 'menu_password', label: '🔑 Şifremi Yenileyemiyorum / Giriş Sorunu' },
  { id: 'menu_link', label: '🔗 İşletme Linkim Bozuk / Açılmıyor' },
  { id: 'menu_booking', label: '📅 Randevu Alma veya İptal Sorunu' },
  { id: 'menu_qr_wp', label: '📱 QR Kod, Afiş veya WhatsApp Sorusu' },
  { id: 'menu_billing', label: '💳 Paketler & Ödeme İşlemleri' },
  { id: 'menu_complaint', label: '🚨 Güvenilir Olmayan İşletme Şikayeti' },
];

const SUB_AI_CHOICES: Record<string, { reply: string; options: Array<{ id: string; label: string }> }> = {
  menu_app_error: {
    reply: 'Hangi kısımda hata yaşıyorsunuz? Lütfen aşağıdan tıklayarak seçin veya mesaj olarak yazın:',
    options: [
      { id: 'ans_link_broken', label: '🔗 İşletme adı/linki değiştirdim, sayfa bulunamadı diyor' },
      { id: 'ans_calendar_empty', label: '⏰ Takvimde randevu saatleri kapalı / görünmüyor' },
      { id: 'ans_staff_limit', label: '👥 Personel veya hizmet eklerken uyarı alıyorum' },
      { id: 'connect_human', label: '👨‍💻 Farklı bir hata var, Müşteri Temsilcisine Bağlan' },
    ],
  },
  menu_booking: {
    reply: 'Randevularla ilgili hangi konuda yardım istersiniz?',
    options: [
      { id: 'ans_cancel_apt', label: '❌ Aldığım randevuyu nasıl iptal ederim?' },
      { id: 'ans_slot_taken', label: '📅 İstediğim saat listede neden çıkmıyor?' },
      { id: 'connect_human', label: '👨‍💻 Müşteri Temsilcisine Bağlan' },
    ],
  },
};

const AI_DETAILED_ANSWERS: Record<string, string> = {
  menu_password:
    '🔑 **Şifre Yenileme & Giriş Çözümü:**\n\n1. Giriş ekranındaki (/login) **"Şifremi Unuttum"** butonuna tıklayarak e-postanıza sıfırlama bağlantısı gönderebilirsiniz.\n2. Eğer bağlantı gelmediyse veya hata alıyorsanız hemen aşağıdaki **"👨‍💻 Müşteri Temsilcisine Bağlan"** butonuna basın; destek ekibimiz size doğrudan şifre yenileme bağlantısını buradan gönderecektir!',
  menu_link:
    '🔗 **İşletme Linki (Bağlantı) Çözümü:**\n\n1. İşletmem > **İşletme Ayarları** sayfasından linkinizi kontrol edip kaydedebilirsiniz.\n2. Eğer linkinizi bulamıyorsanız veya bozuk görünüyorsa aşağıdaki **"👨‍💻 Müşteri Temsilcisine Bağlan"** butonuna tıklayın; temsilcimiz işletme bağlantınızı tek tuşla onarıp size buradan gönderecektir!',
  ans_link_broken:
    '🔗 **İşletme Bağlantısı Hatası:**\n\nİşletme adını değiştirdiğinizde Türkçe karakterlerden kaynaklanan bağlantı sorunu sistemimizde otomatik onarılmıştır. Hala açılmıyorsa aşağıdaki **"👨‍💻 Müşteri Temsilcisine Bağlan"** butonuna tıklayın; temsilcimiz çalışan güncel bağlantınızı hemen sohbete gönderecektir.',
  ans_calendar_empty:
    '⏰ **Takvimde Saat Görünmeme Çözümü:**\n\n• **İşletme Ayarları > Çalışma Saatleri** kısmında günlerin "Açık" olduğundan emin olun.\n• **Personel Yönetimi** kısmında en az 1 personelinizin hizmetlerle eşleşmiş olması gerekir.\n• İsterseniz **"👨‍💻 Müşteri Temsilcisine Bağlan"** butonuna basın, temsilcimiz çalışma saatlerinizi uzaktan tek tuşla açsın!',
  ans_staff_limit:
    '👥 **Personel & Hizmet Limitleri:**\n\nÜcretsiz pakette 1 personel ve 5 hizmet tanımlanabilir. Limitinizi artırmak için **Abonelik & Lisans** sayfasından üst pakete geçebilir veya müşteri temsilcimize bağlanarak destek isteyebilirsiniz.',
  ans_cancel_apt:
    '❌ **Randevu İptali:**\n\nRandevu aldığınız işletmenin sayfasına girip **"Randevu Sorgula / İptal"** sekmesine tıklayın, telefon numaranızı yazarak randevunuzu anında iptal edebilirsiniz.',
  ans_slot_taken:
    '📅 **Müsait Saatler:**\n\nDolu olan saatler çakışma önleme motoru tarafından otomatik gizlenir. Farklı bir gün veya "Fark Etmez (İlk Müsait Uzman)" seçeneğini deneyebilirsiniz.',
  menu_qr_wp:
    '📱 **QR Kod, Vitrin Afişi & WhatsApp:**\n\n• İşletme Tablosunun sol menüsündeki **"QR Kod"** butonundan baskıya hazır vitrin afişinizi indirebilirsiniz.\n• Randevu alındığında veya onaylandığında çıkan yeşil **WhatsApp** butonuyla hazır mesajı tek tuşla gönderebilirsiniz.',
  menu_billing:
    '💳 **Paketler & Abonelik:**\n\nİşletmem > **Abonelik & Lisans** menüsünden Standart, Profesyonel veya Kurumsal paketlere geçiş yapabilirsiniz. Özel kampanya veya paket tanımlaması için müşteri temsilcimize bağlanabilirsiniz.',
  menu_complaint:
    '🚨 **Güvenlik & İşletme Şikayeti:**\n\nGüvenilir olmayan veya kuralları ihlal eden bir işletmeyi bildirmek için lütfen aşağıdaki **"👨‍💻 Müşteri Temsilcisine Bağlan"** butonuna tıklayın ve işletme adını/ekran görüntüsünü yazın. Güvenlik ekibimiz işletmeyi inceleyip anında yasaklayacaktır.',
};

async function compressImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1000;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(ev.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.onerror = () => reject(new Error('Görsel okunamadı.'));
      img.src = ev.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Dosya okunamadı.'));
    reader.readAsDataURL(file);
  });
}

function getInitialAgentMessage(agent: SupportAgent): SupportChatMessage {
  return {
    sender: 'ai',
    text:
      agent.welcomeGreeting +
      '\n\nSize hemen yardımcı olabilmem için aşağıdaki hızlı konulardan birini seçebilir veya sorununuzu doğrudan aşağıya mesaj olarak yazabilirsiniz:',
    created_at: new Date().toISOString(),
    options: MAIN_AI_CHOICES,
  };
}

export function SupportFloatingWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname() || '';

  // Müşteri randevu ekranlarında (/[slug]) işletmenin kendi 'İşletmeye Sor' butonu olduğu için
  // platform teknik destek ikonunu gizleyerek butonların birbirine girmesini ve çakışmasını engelle
  const isMerchantBookingPage =
    Boolean(pathname) &&
    !pathname.startsWith('/dashboard') &&
    pathname !== '/' &&
    pathname !== '/login' &&
    pathname !== '/register' &&
    pathname !== '/forgot-password' &&
    pathname !== '/reset-password' &&
    pathname !== '/create-business' &&
    pathname !== '/nasil-kullanilir' &&
    pathname !== '/yasal';

  // Yönetim panelinde telefonda alt sekme çubuğu olduğu için buton onun üstünde durur
  const inDashboard = pathname.startsWith('/dashboard');
  const inMessages = pathname.startsWith('/dashboard/messages');
  const [mobileWidgetDismissed, setMobileWidgetDismissed] = useState(false);

  // Global announcement banner from platform_settings
  const [announcementActive, setAnnouncementActive] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // User identity (automatically filled if logged in, or editable by guest)
  const [senderName, setSenderName] = useState('Ziyaretçi Kullanıcı');
  const [senderContact, setSenderContact] = useState('Web Sohbet');
  const [lastSelectedTopic, setLastSelectedTopic] = useState('Canlı Destek Görüşmesi');
  const [lastCategory, setLastCategory] = useState<'support' | 'complaint' | 'billing'>('support');

  // Human Representative Persona & Typing State
  const [assignedAgent] = useState<SupportAgent>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('randevory_assigned_agent_id');
      const found = SUPPORT_AGENTS.find((a) => a.id === saved);
      if (found) return found;
      const picked = SUPPORT_AGENTS[Math.floor(Math.random() * SUPPORT_AGENTS.length)];
      localStorage.setItem('randevory_assigned_agent_id', picked.id);
      return picked;
    }
    return SUPPORT_AGENTS[0];
  });
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const typingTimerRef = useRef<any>(null);

  // Unified Chat Messages when in AI stage
  const [localMessages, setLocalMessages] = useState<SupportChatMessage[]>(() => [
    getInitialAgentMessage(SUPPORT_AGENTS[0]),
  ]);

  // Active Database Ticket (once escalated to human agent)
  const [activeTicket, setActiveTicket] = useState<SupportTicketRow | null>(null);
  const [inputText, setInputText] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // Fullscreen Image Lightbox
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      }

      const savedTicketId =
        typeof window !== 'undefined' ? localStorage.getItem(ACTIVE_TICKET_STORAGE_KEY) : null;

      if (savedTicketId) {
        await fetchActiveTicketById(savedTicketId);
      }

      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        const metaName =
          (authData.user.user_metadata?.full_name as string) ||
          authData.user.email?.split('@')[0] ||
          'Kullanıcı';
        setSenderName(metaName);
        if (authData.user.email) {
          setSenderContact(authData.user.email);
        }
      }
    }

    loadInitial();
  }, [fetchActiveTicketById]);

  // Poll active ticket every 3 seconds when widget is open so Admin replies appear live
  useEffect(() => {
    if (!isOpen || !activeTicket?.id) return;
    const timer = setInterval(() => {
      fetchActiveTicketById(activeTicket.id);
    }, 3000);
    return () => clearInterval(timer);
  }, [isOpen, activeTicket?.id, fetchActiveTicketById]);

  const displayedMessages: SupportChatMessage[] = React.useMemo(() => {
    if (activeTicket) {
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
    }
    return localMessages;
  }, [activeTicket, localMessages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    }
  }, [isOpen, displayedMessages.length, activeTicket?.status]);

  // Escalate current AI conversation to Live Human Representative (creates DB ticket)
  const connectToHumanRepresentative = async (customFirstUserMessage?: string, customImage?: string | null) => {
    if (sending) return;
    setSending(true);
    try {
      const supabase = createClient();

      const historyToSave: SupportChatMessage[] = [...localMessages].map((m) => ({
        sender: m.sender,
        text: m.text,
        image_url: m.image_url || null,
        created_at: m.created_at,
      }));

      if (customFirstUserMessage || customImage) {
        historyToSave.push({
          sender: 'user',
          text: customFirstUserMessage || '📷 [Fotoğraf Gönderildi]',
          image_url: customImage || null,
          created_at: new Date().toISOString(),
        });
      } else {
        historyToSave.push({
          sender: 'user',
          text: '👨‍💻 Canlı Müşteri Temsilcisine bağlanmak istiyorum.',
          created_at: new Date().toISOString(),
        });
      }

      const lastUserText =
        customFirstUserMessage ||
        [...historyToSave].reverse().find((m) => m.sender === 'user')?.text ||
        'Canlı Destek Talebi';

      const { data, error } = await supabase
        .from('platform_support_tickets')
        .insert({
          sender_name: senderName.trim() || 'Ziyaretçi',
          sender_contact: senderContact.trim() || 'Canlı Sohbet',
          category: lastCategory,
          subject: lastSelectedTopic || lastUserText.slice(0, 50),
          message: lastUserText,
          messages: historyToSave,
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
      setInputText('');
      setImagePreview(null);
    } catch (err: any) {
      alert(err?.message || 'Müşteri temsilcisine bağlanırken hata oluştu.');
    } finally {
      setSending(false);
    }
  };

  // Handle clicking any option bubble inside the AI chat
  const handleOptionClick = async (optId: string, optLabel: string) => {
    const nowIso = new Date().toISOString();

    if (optId === 'connect_human') {
      await connectToHumanRepresentative();
      return;
    }

    if (optId === 'solved_thanks') {
      setLocalMessages((prev) => [
        ...prev,
        { sender: 'user', text: '✅ Teşekkürler, sorunum çözüldü!', created_at: nowIso },
        {
          sender: 'ai',
          text: 'Rica ederim! 😊 Başka bir sorunuz olursa aşağıdan yeniden seçebilir veya müşteri temsilcimize bağlanabilirsiniz:',
          created_at: new Date().toISOString(),
          options: MAIN_AI_CHOICES,
        },
      ]);
      return;
    }

    if (optId === 'restart_options') {
      setLocalMessages((prev) => [
        ...prev,
        { sender: 'user', text: '🔄 Başka bir konu seçmek istiyorum', created_at: nowIso },
        {
          sender: 'ai',
          text: 'Tabii! Lütfen aşağıdan destek almak istediğiniz konuyu seçin:',
          created_at: new Date().toISOString(),
          options: MAIN_AI_CHOICES,
        },
      ]);
      return;
    }

    setLastSelectedTopic(optLabel.replace(/^[^\wğüşıöçĞÜŞİÖÇ]+/, '').trim());
    if (optId === 'menu_complaint') setLastCategory('complaint');
    else if (optId === 'menu_billing') setLastCategory('billing');
    else setLastCategory('support');

    if (SUB_AI_CHOICES[optId]) {
      const sub = SUB_AI_CHOICES[optId];
      setLocalMessages((prev) => [...prev, { sender: 'user', text: optLabel, created_at: nowIso }]);
      setIsAgentTyping(true);
      setTimeout(() => {
        setIsAgentTyping(false);
        setLocalMessages((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: sub.reply,
            created_at: new Date().toISOString(),
            options: sub.options,
          },
        ]);
      }, 7000);
      return;
    }

    const answer = AI_DETAILED_ANSWERS[optId] || solveSupportQuery(optLabel).solution;
    if (answer) {
      setLocalMessages((prev) => [...prev, { sender: 'user', text: optLabel, created_at: nowIso }]);
      setIsAgentTyping(true);
      setTimeout(() => {
        setIsAgentTyping(false);
        const naturalAnswer = `Merhabalar, ben ${assignedAgent.name}. Konuyla ilgili hemen yardımcı olayım:\n\n${answer}\n\nİşlemi yaptıktan sonra buradan bana yazarsanız ben de sistemden kontrol edebilirim, başka bir sorunuz olursa da buradayım! 😊`;
        setLocalMessages((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: naturalAnswer,
            created_at: new Date().toISOString(),
            showEscalationButtons: true,
          },
        ]);
      }, 9000);
    }
  };

  // Handle bottom input submit (works BOTH in AI stage and in Human Representative stage!)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if ((!text && !imagePreview) || sending) return;

    // 1. If already connected to Human Representative (activeTicket exists), send live message to DB
    if (activeTicket) {
      setSending(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('support_send_user_msg', {
          p_ticket_id: activeTicket.id,
          p_message: text,
          p_image_url: imagePreview || '',
        });

        if (error) throw error;

        if (data) {
          setActiveTicket(data as SupportTicketRow);
        } else {
          await fetchActiveTicketById(activeTicket.id);
        }
        setInputText('');
        setImagePreview(null);
      } catch (err: any) {
        alert(err?.message || 'Mesaj gönderilemedi.');
      } finally {
        setSending(false);
      }
      return;
    }

    // 2. If user attached a photo in AI stage, immediately escalate to Human Representative with the photo!
    if (imagePreview) {
      await connectToHumanRepresentative(text || '📷 [Ekran Görüntüsü Gönderildi]', imagePreview);
      return;
    }

    // 3. Otherwise, user typed a message in AI stage: AI tries to answer first & offers "Müşteri Temsilcisine Bağlan"
    setInputText('');
    const nowIso = new Date().toISOString();
    const lower = text.toLowerCase();
    setLastSelectedTopic(text.slice(0, 50));

    let aiResponseText = '';
    if (lower.includes('şifre') || lower.includes('giriş') || lower.includes('parola')) {
      aiResponseText = AI_DETAILED_ANSWERS.menu_password;
    } else if (lower.includes('link') || lower.includes('bağlantı') || lower.includes('bulunamadı') || lower.includes('açılmıyor')) {
      aiResponseText = AI_DETAILED_ANSWERS.menu_link;
    } else if (lower.includes('saat') || lower.includes('takvim') || lower.includes('müsait')) {
      aiResponseText = AI_DETAILED_ANSWERS.ans_calendar_empty;
    } else if (lower.includes('iptal')) {
      aiResponseText = AI_DETAILED_ANSWERS.ans_cancel_apt;
    } else if (lower.includes('qr') || lower.includes('afiş') || lower.includes('whatsapp')) {
      aiResponseText = AI_DETAILED_ANSWERS.menu_qr_wp;
    } else if (lower.includes('paket') || lower.includes('ücret') || lower.includes('fiyat')) {
      aiResponseText = AI_DETAILED_ANSWERS.menu_billing;
    } else if (lower.includes('temsilci') || lower.includes('insan') || lower.includes('admin') || lower.includes('yetkili') || lower.includes('bağla')) {
      await connectToHumanRepresentative(text);
      return;
    } else {
      aiResponseText =
        `Mesajınızı aldım ("${text}").\n\n` +
        `Size hemen yardımcı olabilmem için aşağıdan ilgili konuyu seçebilir veya doğrudan **"👨‍💻 Müşteri Temsilcisine Bağlan"** butonuna tıklayarak canlı destek ekibimizle görüşebilirsiniz:`;
    }

    setLocalMessages((prev) => [
      ...prev,
      { sender: 'user', text, created_at: nowIso },
      {
        sender: 'ai',
        text: aiResponseText,
        created_at: new Date().toISOString(),
        showEscalationButtons: true,
      },
    ]);
  };

  const handleSelectImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageToDataUrl(file);
      setImagePreview(dataUrl);
    } catch {
      alert('Fotoğraf yüklenirken bir hata oluştu.');
    }
    e.target.value = '';
  };

  const handleStartNewConversation = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACTIVE_TICKET_STORAGE_KEY);
    }
    setActiveTicket(null);
    setInputText('');
    setImagePreview(null);
    setLocalMessages([getInitialAgentMessage(assignedAgent)]);
  };

  const lastMsg = displayedMessages[displayedMessages.length - 1];
  const isWaitingForHumanAdmin =
    Boolean(activeTicket) && activeTicket?.status !== 'closed' && lastMsg?.sender === 'user';

  if (isMerchantBookingPage) {
    return null;
  }

  return (
    <>
      {/* Global Top Announcement Banner (Kayan Akıcı Şerit - Marquee) */}
      {announcementActive && announcementText && !bannerDismissed && (
        <div className="bg-gradient-to-r from-slate-950 via-brand-900 to-indigo-950 text-white border-b border-indigo-500/30 py-2 px-3 text-xs font-semibold relative z-[60] shadow-md overflow-hidden flex items-center justify-between gap-3">
          {/* Sol Kampanya Rozeti */}
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] tracking-wide shrink-0 shadow-xs uppercase">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping inline-block" />
            🔥 FIRSAT
          </div>

          {/* Kayan Yazı Akışı (Marquee Ticker) */}
          <div
            className="flex-1 overflow-hidden relative cursor-pointer select-none"
            onClick={() => setIsOpen(true)}
            title="Detaylar ve fırsattan yararlanmak için tıklayın"
          >
            <div className="animate-marquee inline-flex items-center gap-16 font-bold tracking-wide text-[11px] sm:text-xs text-white/95">
              <span className="inline-flex items-center gap-2">
                <span>{announcementText}</span>
                <span className="px-2 py-0.5 rounded-full bg-brand-500/30 text-amber-300 border border-amber-400/30 text-[10px] font-bold">
                  👉 Destekle İletişime Geçin &rarr;
                </span>
              </span>
              <span className="inline-flex items-center gap-2">
                <span>{announcementText}</span>
                <span className="px-2 py-0.5 rounded-full bg-brand-500/30 text-amber-300 border border-amber-400/30 text-[10px] font-bold">
                  👉 Destekle İletişime Geçin &rarr;
                </span>
              </span>
            </div>
          </div>

          {/* Sağ Butonlar: Canlı Destek & Kapat */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-[11px] font-extrabold transition-all shadow-xs"
            >
              Destek Al
            </button>
            <button
              type="button"
              onClick={() => setBannerDismissed(true)}
              className="text-white/60 hover:text-white p-1 rounded-md transition-colors"
              title="Duyuruyu Kapat"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Image Lightbox */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-[80] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-3xl max-h-[85vh]">
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 px-3 py-1 rounded-lg bg-white/20 text-white text-xs font-bold hover:bg-white/30"
            >
              Kapat (X)
            </button>
            <img
              src={lightboxImage}
              alt="Ekran Görüntüsü"
              className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl border border-white/20 object-contain"
            />
          </div>
        </div>
      )}

      {/* Floating Support Trigger Button */}
      <div
        className={`fixed z-50 flex flex-col items-end ${
          inMessages || mobileWidgetDismissed ? 'hidden md:flex' : ''
        } ${
          isOpen
            ? 'inset-x-2 bottom-2 sm:inset-x-auto sm:right-5 sm:bottom-5'
            : `right-3 sm:right-5 ${inDashboard ? 'bottom-20 md:bottom-5' : 'bottom-4 sm:bottom-5'}`
        }`}
      >
        {!isOpen && (
          <div className="relative group">
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              aria-label="Canlı Destek"
              className="flex items-center gap-2.5 p-2.5 sm:pl-4 sm:pr-5 sm:py-3 rounded-full bg-slate-900 hover:bg-brand-600 text-white shadow-2xl shadow-slate-900/30 border border-slate-700/80 transition-all hover:scale-105"
            >
              <div className="relative flex items-center justify-center w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-brand-600 group-hover:bg-white group-hover:text-brand-600 transition-colors">
                <Headset className="w-4 h-4" />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-[10px] font-bold uppercase tracking-wider text-brand-300 group-hover:text-white/90 leading-none">
                  Canlı Destek Masası
                </div>
                <div className="text-xs font-extrabold leading-tight mt-0.5">
                  Canlı Destek / Bildir
                </div>
              </div>
            </button>
            {inDashboard && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMobileWidgetDismissed(true);
                }}
                title="Destek butonunu gizle"
                className="md:hidden absolute -top-1 -left-1 w-5 h-5 rounded-full bg-slate-800 text-slate-300 border border-slate-600 flex items-center justify-center text-[10px] font-bold shadow-md hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Unified Single Support Chat Window */}
        {isOpen && (
          <div className="w-full sm:w-[425px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-900 text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shrink-0 shadow-inner relative">
                  {activeTicket ? (
                    <Headset className="w-5 h-5 text-white" />
                  ) : (
                    <Bot className="w-5 h-5 text-white" />
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                    RANDEVORY Canlı Destek
                  </h3>
                  <p className="text-[11px] text-slate-300 truncate max-w-[205px]">
                    {activeTicket
                      ? '👨‍💻 Canlı Müşteri Temsilcisi Sohbeti'
                      : `${assignedAgent.name} (Çevrimiçi)`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleStartNewConversation}
                  title="Sohbeti Sıfırla / Yeni Konu Başlat"
                  className="text-[11px] font-bold px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center gap-1 transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Yeni Konu
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Unified Chat Scroll Area */}
            <div className="flex flex-col h-[min(475px,calc(100dvh-8rem))]">
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
                {/* Sender & Status Pill Bar */}
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between shadow-2xs">
                  <span className="truncate max-w-[180px]">
                    Gönderen: <strong>{activeTicket?.sender_name || senderName}</strong>
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      !activeTicket
                        ? 'bg-indigo-100 text-indigo-800'
                        : activeTicket.status === 'closed'
                        ? 'bg-slate-200 text-slate-700'
                        : activeTicket.status === 'answered'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {!activeTicket
                      ? `🟢 ${assignedAgent.name} (Çevrimiçi)`
                      : activeTicket.status === 'closed'
                      ? 'Görüşme Tamamlandı'
                      : activeTicket.status === 'answered'
                      ? 'Destek Ekibi Yanıtladı'
                      : 'Destek Ekibi Bekleniyor'}
                  </span>
                </div>

                {/* All Chat Bubbles (AI, User, and Admin) */}
                {displayedMessages.map((msg, idx) => {
                  const isUser = msg.sender === 'user';
                  const isAi = msg.sender === 'ai';
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                          isUser
                            ? 'bg-brand-600 text-white rounded-tr-sm'
                            : isAi
                            ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
                            : 'bg-white border-2 border-brand-300 text-slate-900 rounded-tl-sm'
                        }`}
                      >
                        {!isUser && (
                          <div className="font-extrabold text-[11px] text-slate-800 flex items-center gap-1.5 mb-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                            <span>{assignedAgent.name} • {assignedAgent.title}</span>
                          </div>
                        )}

                        {msg.image_url && (
                          <div className="mb-2">
                            <img
                              src={msg.image_url}
                              alt="Gönderilen Fotoğraf"
                              onClick={() => setLightboxImage(msg.image_url || null)}
                              className="rounded-xl max-h-48 w-auto object-cover border border-white/20 cursor-zoom-in hover:opacity-95 transition-opacity"
                            />
                          </div>
                        )}

                        <p className="whitespace-pre-wrap">{msg.text}</p>

                        {/* Clickable Choice Buttons inside AI bubble (only active if not yet escalated) */}
                        {!activeTicket && msg.options && msg.options.length > 0 && (
                          <div className="mt-3 space-y-1.5">
                            {msg.options.map((opt) => (
                              <button
                                key={opt.id}
                                type="button"
                                disabled={sending}
                                onClick={() => handleOptionClick(opt.id, opt.label)}
                                className="w-full text-left px-3 py-2 rounded-xl bg-slate-50 hover:bg-brand-50 border border-slate-200 hover:border-brand-300 text-slate-800 hover:text-brand-700 font-semibold text-[11px] flex items-center justify-between transition-all"
                              >
                                <span>{opt.label}</span>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              </button>
                            ))}

                            {/* Direct Connect to Customer Representative button right below options */}
                            <button
                              type="button"
                              disabled={sending}
                              onClick={() => connectToHumanRepresentative()}
                              className="w-full mt-2 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-sm transition-all"
                            >
                              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                              👨‍💻 Direkt Müşteri Temsilcisine Bağlan
                            </button>
                          </div>
                        )}

                        {/* Escalation / Solved Buttons after AI gives an answer */}
                        {!activeTicket && msg.showEscalationButtons && (
                          <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                            <div className="grid grid-cols-2 gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOptionClick('solved_thanks', 'Çözüldü')}
                                className="px-2.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[11px] flex items-center justify-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Sorunum Çözüldü
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOptionClick('restart_options', 'Diğer Şıklar')}
                                className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center justify-center gap-1"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Diğer Şıklar
                              </button>
                            </div>
                            <button
                              type="button"
                              disabled={sending}
                              onClick={() => connectToHumanRepresentative()}
                              className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-sm"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              👨‍💻 Çözülmedi, Müşteri Temsilcisine Bağlan
                            </button>
                          </div>
                        )}
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

                {/* Waiting Indicator when connected to Human Admin and waiting for reply */}
                {isWaitingForHumanAdmin && (
                  <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 animate-spin" />
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

              {/* Image Preview Bar before sending */}
              {imagePreview && (
                <div className="px-3 py-2 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={imagePreview}
                      alt="Önizleme"
                      className="w-10 h-10 rounded-lg object-cover border border-slate-300"
                    />
                    <span className="text-[11px] font-semibold text-slate-700">
                      📷 Fotoğraf eklendi (Göndermeye hazır)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setImagePreview(null)}
                    className="text-rose-600 hover:text-rose-700 p-1 text-xs font-bold"
                  >
                    Kaldır
                  </button>
                </div>
              )}

              {/* Bottom Message & Photo Input Bar */}
              {activeTicket?.status === 'closed' ? (
                <div className="p-3 bg-white border-t border-slate-200 text-center space-y-2">
                  <div className="text-xs text-slate-500 font-medium">
                    Bu destek görüşmesi çözümlenerek kapatılmıştır.
                  </div>
                  <button
                    type="button"
                    onClick={handleStartNewConversation}
                    className="w-full py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs"
                  >
                    Yeni Destek Sohbeti Başlat
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleSelectImage}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Fotoğraf / Ekran Görüntüsü Gönder"
                    className="p-2.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 shrink-0 transition-colors"
                  >
                    <ImagePlus className="w-4 h-4 text-brand-600" />
                  </button>
                  <input
                    type="text"
                    placeholder="Destek ekibine mesajınızı yazın..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    type="submit"
                    disabled={sending || (!inputText.trim() && !imagePreview)}
                    className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 disabled:opacity-50 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Gönder
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
