'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  solveSupportQuery,
  SUPPORT_AGENTS,
  SupportAgent,
  getRandomSupportAgent,
  getInitialBotMessage,
  formatConversationalAgentReply,
} from '@/lib/support-ai-brain';
import {
  Headset,
  X,
  Send,
  PlusCircle,
  ImagePlus,
  CheckCircle2,
  RotateCcw,
  UserCheck,
  ChevronRight,
  Check,
  CheckCheck,
  Star,
} from 'lucide-react';

export interface SupportChatMessage {
  sender: 'user' | 'admin' | 'ai' | 'system';
  agent_name?: string;
  text: string;
  image_url?: string | null;
  created_at: string;
  options?: Array<{ id: string; label: string }>;
  showEscalationButtons?: boolean;
  isRatingCard?: boolean;
  ratingScore?: number;
  ratingComment?: string;
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
  is_taken_over?: boolean;
  replied_at: string | null;
  created_at: string;
}

const ACTIVE_TICKET_STORAGE_KEY = 'randevory_live_support_v3';
const ASSIGNED_AGENT_KEY = 'randevory_assigned_agent_id_v3';

const MAIN_AI_CHOICES = [
  { id: 'menu_app_error', label: '🛠️ Sitede / Uygulamada Hata Alıyorum' },
  { id: 'menu_password', label: '🔑 Şifremi Yenileyemiyorum / Giriş Sorunu' },
  { id: 'menu_link', label: '🔗 İşletme Linkim Bozuk / Açılmıyor' },
  { id: 'menu_booking', label: '📅 Randevu Alma veya İptal Sorunu' },
  { id: 'menu_qr_wp', label: '📱 QR Kod, Afiş veya WhatsApp Sorusu' },
  { id: 'menu_billing', label: '💳 Paketler & Ödeme İşlemleri' },
  { id: 'connect_human', label: '👩‍💼 Canlı Müşteri Temsilcisine Bağlan' },
];

const SUB_AI_CHOICES: Record<string, { reply: string; options: Array<{ id: string; label: string }> }> = {
  menu_app_error: {
    reply: 'Hangi kısımda hata yaşıyorsunuz? Lütfen aşağıdan tıklayarak seçin veya mesaj olarak yazın:',
    options: [
      { id: 'ans_link_broken', label: '🔗 İşletme adı/linki değiştirdim, sayfa bulunamadı diyor' },
      { id: 'ans_calendar_empty', label: '⏰ Takvimde randevu saatleri kapalı / görünmüyor' },
      { id: 'ans_staff_limit', label: '👥 Personel veya hizmet eklerken uyarı alıyorum' },
      { id: 'connect_human', label: '👩‍💼 Canlı Müşteri Temsilcisine Bağlan' },
    ],
  },
  menu_booking: {
    reply: 'Randevularla ilgili hangi konuda yardım istersiniz?',
    options: [
      { id: 'ans_cancel_apt', label: '❌ Aldığım randevuyu nasıl iptal ederim?' },
      { id: 'ans_slot_taken', label: '📅 İstediğim saat listede neden çıkmıyor?' },
      { id: 'connect_human', label: '👩‍💼 Müşteri Temsilcisine Bağlan' },
    ],
  },
};

const AI_DETAILED_ANSWERS: Record<string, string> = {
  menu_password:
    '🔑 **Şifre Yenileme & Giriş Çözümü:**\n\n1. Giriş ekranındaki (/login) **"Şifremi Unuttum"** butonuna tıklayarak e-postanıza sıfırlama bağlantısı gönderebilirsiniz.\n2. Eğer bağlantı gelmediyse veya hata alıyorsanız aşağıdaki kutudan mesajınızı yazın; destek ekibimiz size buradan doğrudan yardımcı olacaktır!',
  menu_link:
    '🔗 **İşletme Linki (Bağlantı) Çözümü:**\n\n1. İşletmem > **İşletme Ayarları** sayfasından linkinizi kontrol edip kaydedebilirsiniz.\n2. Eğer linkinizi bulamıyorsanız veya bozuk görünüyorsa aşağıdaki kutudan yazın; çalışan güncel bağlantınızı hemen buradan iletelim!',
  ans_link_broken:
    '🔗 **İşletme Bağlantısı Hatası:**\n\nİşletme adını değiştirdiğinizde Türkçe karakterlerden kaynaklanan bağlantı sorunu sistemimizde otomatik onarılmıştır. Hala açılmıyorsa aşağıya mesajınızı yazın, bağlantınızı anında kontrol edelim.',
  ans_calendar_empty:
    '⏰ **Takvimde Saat Görünmeme Çözümü:**\n\n• **İşletme Ayarları > Çalışma Saatleri** kısmında günlerin "Açık" olduğundan emin olun.\n• **Personel Yönetimi** kısmında en az 1 personelinizin hizmetlerle eşleşmiş olması gerekir.\n• Durum devam ederse aşağıdan bize yazabilirsiniz, hemen kontrol edelim!',
  ans_staff_limit:
    '👥 **Personel & Hizmet Limitleri:**\n\nÜcretsiz pakette 1 personel ve 5 hizmet tanımlanabilir. Limitinizi artırmak için **Abonelik & Lisans** sayfasından üst pakete geçebilir veya bize buradan yazabilirsiniz.',
  ans_cancel_apt:
    '❌ **Randevu İptali:**\n\nRandevu aldığınız işletmenin sayfasına girip **"Randevu Sorgula / İptal"** sekmesine tıklayın, telefon numaranızı yazarak randevunuzu anında iptal edebilirsiniz.',
  ans_slot_taken:
    '📅 **Müsait Saatler:**\n\nDolu olan saatler çakışma önleme motoru tarafından otomatik gizlenir. Farklı bir gün veya "Fark Etmez (İlk Müsait Uzman)" seçeneğini deneyebilirsiniz.',
  menu_qr_wp:
    '📱 **QR Kod, Vitrin Afişi & WhatsApp:**\n\n• İşletme Tablosunun sol menüsündeki **"QR Kod"** butonundan baskıya hazır vitrin afişinizi indirebilirsiniz.\n• Randevu alındığında veya onaylandığında çıkan yeşil **WhatsApp** butonuyla hazır mesajı tek tuşla gönderebilirsiniz.',
  menu_billing:
    '💳 **Paketler & Abonelik:**\n\nİşletmem > **Abonelik & Lisans** menüsünden Standart, Profesyonel veya Kurumsal paketlere geçiş yapabilirsiniz. Özel kampanya veya paket tanımlaması için bize buradan yazabilirsiniz.',
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

export function SupportFloatingWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname() || '';

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

  const inDashboard = pathname.startsWith('/dashboard');
  const inMessages = pathname.startsWith('/dashboard/messages');
  const [mobileWidgetDismissed, setMobileWidgetDismissed] = useState(false);

  // Global announcement banner
  const [announcementActive, setAnnouncementActive] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // User identity
  const [senderName, setSenderName] = useState('Ziyaretçi Kullanıcı');
  const [senderContact, setSenderContact] = useState('Web Sohbet');
  const [lastSelectedTopic, setLastSelectedTopic] = useState('Canlı Destek Görüşmesi');
  const [lastCategory, setLastCategory] = useState<'support' | 'complaint' | 'billing'>('support');

  // Assigned Agent - ONLY assigned when user connects to a representative!
  const [assignedAgent, setAssignedAgent] = useState<SupportAgent | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(ASSIGNED_AGENT_KEY);
      if (saved) {
        return SUPPORT_AGENTS.find((a) => a.id === saved) || null;
      }
    }
    return null;
  });

  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [readMessageTimestamps, setReadMessageTimestamps] = useState<string[]>([]);
  const typingTimerRef = useRef<any>(null);
  const readTimerRef = useRef<any>(null);

  // Initial stage local messages (before activeTicket)
  const [localMessages, setLocalMessages] = useState<SupportChatMessage[]>(() => [
    getInitialBotMessage(),
  ]);

  // Active Database Ticket (once escalated or connected to human representative)
  const [activeTicket, setActiveTicket] = useState<SupportTicketRow | null>(null);
  const [inputText, setInputText] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // Fullscreen Image Lightbox
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Inactivity timeout & Rating state
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [ratingNote, setRatingNote] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [isTerminatedByAgent, setIsTerminatedByAgent] = useState(false);
  const inactivityTimerRef = useRef<any>(null);

  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'end' });
    } else if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, []);

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

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = setTimeout(async () => {
      const repName = assignedAgent?.name || 'Müşteri Temsilcisi';
      const nowIso = new Date().toISOString();

      const timeoutMsg: SupportChatMessage = {
        sender: 'admin',
        agent_name: repName,
        text: 'Uzun süredir sizden bir yanıt alamadım. Başka bir sorunuz veya desteğe ihtiyacınız kalmadıysa görüşmeyi sonlandırıyorum. Hizmetimizi aşağıdan 1-5 yıldızla değerlendirebilirseniz çok seviniriz! İyi günler dilerim 😊',
        created_at: nowIso,
      };

      const ratingCardMsg: SupportChatMessage = {
        sender: 'system',
        text: 'Destek Değerlendirmesi',
        created_at: new Date(Date.now() + 500).toISOString(),
        isRatingCard: true,
      };

      if (activeTicket?.id) {
        try {
          const supabase = createClient();
          await supabase.rpc('support_send_agent_auto_reply', {
            p_ticket_id: activeTicket.id,
            p_reply: timeoutMsg.text,
            p_agent_name: repName,
          });

          const { data } = await supabase
            .from('platform_support_tickets')
            .select('messages')
            .eq('id', activeTicket.id)
            .single();

          if (data && Array.isArray(data.messages)) {
            await supabase
              .from('platform_support_tickets')
              .update({
                messages: [...data.messages, ratingCardMsg],
                status: 'closed',
              })
              .eq('id', activeTicket.id);
          }
          await fetchActiveTicketById(activeTicket.id);
        } catch (e) {
          console.error('Inactivity timeout update error:', e);
        }
      } else {
        setLocalMessages((prev) => [...prev, timeoutMsg, ratingCardMsg]);
      }
    }, 5 * 60 * 1000); // 5 minutes inactivity
  }, [assignedAgent?.name, activeTicket?.id, fetchActiveTicketById]);

  const handleSendRating = async () => {
    setRatingSubmitted(true);
    const feedbackSummary = `${selectedRating} Yıldız ${selectedTags.length > 0 ? `(${selectedTags.join(', ')})` : ''}${ratingNote ? ` - "${ratingNote}"` : ''}`;

    if (activeTicket?.id) {
      try {
        const supabase = createClient();
        await supabase
          .from('platform_support_tickets')
          .update({
            status: 'closed',
            admin_reply: activeTicket.admin_reply
              ? `${activeTicket.admin_reply}\n\n[Müşteri Değerlendirmesi: ${feedbackSummary}]`
              : `[Müşteri Değerlendirmesi: ${feedbackSummary}]`,
          })
          .eq('id', activeTicket.id);
      } catch (e) {
        console.error('Save rating error:', e);
      }
    }
  };



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

  // Poll active ticket every 3 seconds when widget is open so live replies appear
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
          agent_name: assignedAgent?.name || 'Müşteri Temsilcisi',
          text: activeTicket.admin_reply,
          created_at: activeTicket.replied_at || activeTicket.created_at,
        });
      }
      return fallback;
    }
    return localMessages;
  }, [activeTicket, localMessages, assignedAgent?.name]);

  // Auto-scroll on messages change or widget open
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => {
        scrollToBottom(true);
      }, 70);
      return () => clearTimeout(t);
    }
  }, [isOpen, displayedMessages.length, isAgentTyping, scrollToBottom]);

  // Connect to Live Human Representative (Assigns dynamic agent at THAT moment!)
  const connectToHumanRepresentative = async (customFirstUserMessage?: string, customImage?: string | null) => {
    if (sending) return;
    setSending(true);

    // Pick random representative at that exact moment (majority female, some male)
    const pickedAgent = assignedAgent || getRandomSupportAgent();
    setAssignedAgent(pickedAgent);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ASSIGNED_AGENT_KEY, pickedAgent.id);
    }

    try {
      const supabase = createClient();

      const historyToSave: SupportChatMessage[] = [...localMessages].map((m) => ({
        sender: m.sender,
        agent_name: m.agent_name,
        text: m.text,
        image_url: m.image_url || null,
        created_at: m.created_at,
      }));

      // Add system badge that representative joined
      historyToSave.push({
        sender: 'system',
        text: `👩‍💼 Müşteri Temsilcisi ${pickedAgent.name} görüşmeye bağlandı.`,
        created_at: new Date().toISOString(),
      });

      const userMsgText = customFirstUserMessage || '👩‍💼 Canlı Müşteri Temsilcisine bağlanmak istiyorum.';
      historyToSave.push({
        sender: 'user',
        text: userMsgText,
        image_url: customImage || null,
        created_at: new Date().toISOString(),
      });

      const { data, error } = await supabase
        .from('platform_support_tickets')
        .insert({
          sender_name: senderName.trim() || 'Ziyaretçi',
          sender_contact: senderContact.trim() || 'Canlı Sohbet',
          category: lastCategory,
          subject: lastSelectedTopic || userMsgText.slice(0, 50),
          message: userMsgText,
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
      setTimeout(() => scrollToBottom(true), 60);

      // Realistic typing indicator for 2.5s, then send representative's welcome greeting
      setIsAgentTyping(true);
      setTimeout(async () => {
        try {
          const { data: repData } = await supabase.rpc('support_send_agent_auto_reply', {
            p_ticket_id: created.id,
            p_reply: pickedAgent.welcomeGreeting,
            p_agent_name: pickedAgent.name,
          });
          setIsAgentTyping(false);
          if (repData && (repData as any).id) {
            setActiveTicket(repData as SupportTicketRow);
          } else {
            await fetchActiveTicketById(created.id);
          }
          setTimeout(() => scrollToBottom(true), 60);
        } catch {
          setIsAgentTyping(false);
        }
      }, 2500);
    } catch (err: any) {
      alert(err?.message || 'Müşteri temsilcisine bağlanırken hata oluştu.');
    } finally {
      setSending(false);
    }
  };

  // Handle clicking any option bubble inside the chat
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
          sender: 'admin',
          text: 'Rica ederiz, ne demek! İşletmenizin sorunsuz çalışması bizim için en büyük öncelik. Başka bir sorunuz veya desteğe ihtiyacınız olursa bize buradan dilediğiniz zaman yazabilirsiniz! 😊',
          created_at: new Date().toISOString(),
          options: MAIN_AI_CHOICES,
        },
      ]);
      setTimeout(() => scrollToBottom(true), 60);
      return;
    }

    if (optId === 'restart_options') {
      setLocalMessages((prev) => [
        ...prev,
        { sender: 'user', text: '🔄 Başka bir konu seçmek istiyorum', created_at: nowIso },
        {
          sender: 'admin',
          text: 'Tabii ki! Lütfen aşağıdan destek almak istediğiniz konuyu seçin veya sorununuzu kısaca yazın:',
          created_at: new Date().toISOString(),
          options: MAIN_AI_CHOICES,
        },
      ]);
      setTimeout(() => scrollToBottom(true), 60);
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
            sender: 'admin',
            text: sub.reply,
            created_at: new Date().toISOString(),
            options: sub.options,
          },
        ]);
        setTimeout(() => scrollToBottom(true), 60);
      }, 3000);
      return;
    }

    const answer = AI_DETAILED_ANSWERS[optId] || solveSupportQuery(optLabel).solution;
    if (answer) {
      setLocalMessages((prev) => [...prev, { sender: 'user', text: optLabel, created_at: nowIso }]);
      setIsAgentTyping(true);
      setTimeout(() => {
        setIsAgentTyping(false);
        setLocalMessages((prev) => [
          ...prev,
          {
            sender: 'admin',
            text: answer,
            created_at: new Date().toISOString(),
            showEscalationButtons: true,
          },
        ]);
        setTimeout(() => scrollToBottom(true), 60);
      }, 3500);
    }
  };

  // Handle bottom message submit
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if ((!text && !imagePreview) || sending) return;

    setInputText('');
    const currentImg = imagePreview;
    setImagePreview(null);

    // 1. If already connected to Live Ticket (activeTicket exists), send live message to DB
    if (activeTicket) {
      setSending(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('support_send_user_msg', {
          p_ticket_id: activeTicket.id,
          p_message: text || '📷 [Fotoğraf Gönderildi]',
          p_image_url: currentImg || '',
        });

        if (error) throw error;

        let currentTicket = activeTicket;
        if (data && (data as any).id) {
          currentTicket = data as SupportTicketRow;
          setActiveTicket(currentTicket);
        } else {
          await fetchActiveTicketById(activeTicket.id);
        }

        setTimeout(() => scrollToBottom(true), 50);

        // If admin has taken over or ticket is closed, don't auto-reply
        if (currentTicket.is_taken_over || currentTicket.status === 'closed') {
          return;
        }

        const agent = assignedAgent || SUPPORT_AGENTS[0];
        const sentIso = new Date().toISOString();

        // 1. Aşama: Mesaj gönderildi (tek tik ✓). Temsilci hemen görmüyor, 2.8 saniye bekle
        if (readTimerRef.current) clearTimeout(readTimerRef.current);
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

        readTimerRef.current = setTimeout(() => {
          // 2. Aşama: Temsilci bildirimi gördü ve açtı (çift tik ✓✓ Okundu)!
          setReadMessageTimestamps((prev) => [...prev, sentIso]);

          // 3. Aşama: 2.6 saniye mesajı dikkatle okuma ve düşünme payı (+1.1s)
          typingTimerRef.current = setTimeout(() => {
            setIsAgentTyping(true);
            setTimeout(() => scrollToBottom(true), 50);

            // 4. Aşama: İnsan hızında gerçekçi klavye yazma süresi (8.2 saniye - +1.7s)
            setTimeout(async () => {
              try {
                const { data: freshTicket } = await supabase
                  .from('platform_support_tickets')
                  .select('*')
                  .eq('id', currentTicket.id)
                  .maybeSingle();

                if (freshTicket?.is_taken_over || freshTicket?.status === 'closed') {
                  setIsAgentTyping(false);
                  if (freshTicket) setActiveTicket(freshTicket as SupportTicketRow);
                  return;
                }

                let replyText = '';
                try {
                  const aiRes = await fetch('/api/support/ai-reply', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      message: text || 'fotoğraf',
                      agentName: agent.name,
                      history: displayedMessages.slice(-6),
                    }),
                  });
                  if (aiRes.ok) {
                    const aiData = await aiRes.json();
                    if (aiData.reply) {
                      replyText = aiData.reply;
                    }
                  }
                } catch {
                  // Fallback
                }

                if (!replyText) {
                  replyText = formatConversationalAgentReply(agent, text || 'fotoğraf').reply;
                }

                const lowerRep = replyText.toLowerCase();
                const isTerminated =
                  lowerRep.includes('sonlandırılmıştır') ||
                  lowerRep.includes('sonlandırıyorum') ||
                  lowerRep.includes('oturum sonlandırıldı') ||
                  lowerRep.includes('görüşmeyi ben sonlandırıyorum') ||
                  lowerRep.includes('hizmet vermemiz mümkün değildir');

                if (isTerminated) {
                  await supabase.rpc('support_send_agent_auto_reply', {
                    p_ticket_id: currentTicket.id,
                    p_reply: replyText,
                    p_agent_name: agent.name,
                  });

                  const badgeMsg: SupportChatMessage = {
                    sender: 'system',
                    text: '🛑 Görüşme, kurallara uyulmadığı gerekçesiyle temsilci tarafından sonlandırılmıştır.',
                    created_at: new Date(Date.now() + 500).toISOString(),
                  };

                  const { data: latestTicket } = await supabase
                    .from('platform_support_tickets')
                    .select('messages')
                    .eq('id', currentTicket.id)
                    .single();

                  const currentMsgs = latestTicket?.messages || [];
                  await supabase
                    .from('platform_support_tickets')
                    .update({
                      status: 'closed',
                      messages: [...currentMsgs, badgeMsg],
                    })
                    .eq('id', currentTicket.id);

                  setIsAgentTyping(false);
                  setIsTerminatedByAgent(true);
                  await fetchActiveTicketById(currentTicket.id);
                  setTimeout(() => scrollToBottom(true), 60);
                  return;
                }

                const { data: updatedTicket, error: repError } = await supabase.rpc(
                  'support_send_agent_auto_reply',
                  {
                    p_ticket_id: currentTicket.id,
                    p_reply: replyText,
                    p_agent_name: agent.name,
                  }
                );

                setIsAgentTyping(false);

                if (!repError && updatedTicket && (updatedTicket as any).id) {
                  setActiveTicket(updatedTicket as SupportTicketRow);
                } else {
                  await fetchActiveTicketById(currentTicket.id);
                }

                setTimeout(() => scrollToBottom(true), 60);
              } catch (replyErr) {
                console.error('Agent reply error:', replyErr);
                setIsAgentTyping(false);
              }
            resetInactivityTimer();
            }, 8200);
          }, 2600);
        }, 2800);
      } catch (err: any) {
        alert(err?.message || 'Mesaj gönderilemedi.');
      } finally {
        setSending(false);
      }
      return;
    }

    // 2. If user attached a photo in initial stage, immediately escalate to Live Ticket
    if (currentImg) {
      await connectToHumanRepresentative(text || '📷 [Ekran Görüntüsü Gönderildi]', currentImg);
      return;
    }

    // 3. If user explicitly asks to connect in text
    const lower = text.toLowerCase();
    if (
      lower.includes('temsilci') ||
      lower.includes('insan') ||
      lower.includes('admin') ||
      lower.includes('yetkili') ||
      lower.includes('bagla') ||
      lower.includes('baglan') ||
      lower.includes('bağla') ||
      lower.includes('bağlan')
    ) {
      await connectToHumanRepresentative(text);
      return;
    }

    // 4. Initial stage message (before representative is connected)
    const nowIso = new Date().toISOString();
    setLastSelectedTopic(text.slice(0, 50));
    setLocalMessages((prev) => [...prev, { sender: 'user', text, created_at: nowIso }]);
    setTimeout(() => scrollToBottom(true), 50);

    // İnsan hızında kademeli okuma ve yazma:
    // 2.8s okuma payı -> okundu -> 1.5s sonra yazıyor başlar -> 5.5s yazma süresi
    if (readTimerRef.current) clearTimeout(readTimerRef.current);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

    readTimerRef.current = setTimeout(() => {
      setReadMessageTimestamps((prev) => [...prev, nowIso]);

      typingTimerRef.current = setTimeout(() => {
        setIsAgentTyping(true);
        setTimeout(() => scrollToBottom(true), 50);

        setTimeout(async () => {
          let replyText = '';
          let quickActions: Array<{ id: string; label: string; url?: string }> = [];

          try {
            const aiRes = await fetch('/api/support/ai-reply', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                message: text,
                agentName: 'Müşteri Temsilcisi',
                history: localMessages.slice(-6),
              }),
            });
            if (aiRes.ok) {
              const aiData = await aiRes.json();
              if (aiData.reply) {
                replyText = aiData.reply;
                quickActions = aiData.quickActions || [];
              }
            }
          } catch {
            // Fallback
          }

          if (!replyText) {
            const resolution = solveSupportQuery(text);
            replyText = resolution.solution;
            quickActions = resolution.quickActions || [];
          }

          const lowerLocalRep = replyText.toLowerCase();
          const isLocalTerminated =
            lowerLocalRep.includes('sonlandırılmıştır') ||
            lowerLocalRep.includes('sonlandırıyorum') ||
            lowerLocalRep.includes('oturum sonlandırıldı') ||
            lowerLocalRep.includes('görüşmeyi ben sonlandırıyorum') ||
            lowerLocalRep.includes('hizmet vermemiz mümkün değildir');

          if (isLocalTerminated) {
            setIsAgentTyping(false);
            setIsTerminatedByAgent(true);
            setLocalMessages((prev) => [
              ...prev,
              {
                sender: 'admin',
                agent_name: currentAgentName,
                text: replyText,
                created_at: new Date().toISOString(),
              },
              {
                sender: 'system',
                text: '🛑 Görüşme, kurallara uyulmadığı gerekçesiyle temsilci tarafından sonlandırılmıştır.',
                created_at: new Date(Date.now() + 500).toISOString(),
              },
            ]);
            setTimeout(() => scrollToBottom(true), 60);
            return;
          }

          setIsAgentTyping(false);
          setLocalMessages((prev) => [
            ...prev,
            {
              sender: 'admin',
              text: replyText,
              created_at: new Date().toISOString(),
              options:
                quickActions && quickActions.length > 0
                  ? quickActions
                  : MAIN_AI_CHOICES,
              showEscalationButtons: true,
            },
          ]);
          setTimeout(() => scrollToBottom(true), 60);
        resetInactivityTimer();
        }, 7500);
      }, 2500);
    }, 2800);
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

  // Reset conversation completely
  const handleStartNewConversation = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACTIVE_TICKET_STORAGE_KEY);
      localStorage.removeItem(ASSIGNED_AGENT_KEY);
    }
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }
    if (readTimerRef.current) {
      clearTimeout(readTimerRef.current);
    }
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    setRatingSubmitted(false);
    setIsTerminatedByAgent(false);
    setSelectedRating(5);
    setSelectedTags([]);
    setRatingNote('');
    setIsAgentTyping(false);
    setReadMessageTimestamps([]);
    setActiveTicket(null);
    setAssignedAgent(null);
    setInputText('');
    setImagePreview(null);
    setLocalMessages([getInitialBotMessage()]);
  };

  // User closed widget: Reset state completely
  const handleCloseWidget = () => {
    handleStartNewConversation();
    setIsOpen(false);
  };

  if (isMerchantBookingPage) {
    return null;
  }

  // Determine current active agent name for typing indicator & header
  const currentAgentName = assignedAgent?.name || 'Müşteri Temsilcisi';

  return (
    <>
      {/* Global Top Announcement Banner */}
      {announcementActive && announcementText && !bannerDismissed && (
        <div className="bg-gradient-to-r from-slate-950 via-brand-900 to-indigo-950 text-white border-b border-indigo-500/30 py-2 px-3 text-xs font-semibold relative z-[60] shadow-md overflow-hidden flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] tracking-wide shrink-0 shadow-xs uppercase">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping inline-block" />
            🔥 FIRSAT
          </div>

          <div
            className="flex-1 overflow-hidden relative cursor-pointer select-none"
            onClick={() => setIsOpen(true)}
            title="Detaylar ve fırsattan yararlanmak için tıklayın"
          >
            <div className="animate-marquee inline-flex items-center gap-16 font-bold tracking-wide text-[11px] sm:text-xs text-white/95">
              <span>{announcementText}</span>
              <span className="text-amber-300 font-extrabold">🎁 Randevory Canlı Destek Masası 7/24 Aktif!</span>
              <span>{announcementText}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setBannerDismissed(true)}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 shrink-0 transition-colors"
            title="Duyuruyu Kapat"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Fullscreen Image Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={lightboxImage}
              alt="Ekran Görüntüsü"
              className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl border border-white/20 object-contain"
            />
          </div>
        </div>
      )}

      {/* Floating Support Trigger Button (Always Clean Original Look When Closed!) */}
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
              className="flex items-center gap-2.5 p-2.5 sm:pl-4 sm:pr-5 sm:py-3 rounded-full bg-slate-900 hover:bg-brand-600 text-white shadow-2xl shadow-slate-900/40 border border-slate-700/80 transition-all hover:scale-105"
            >
              <div className="relative flex items-center justify-center w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-brand-600 group-hover:bg-white group-hover:text-brand-600 transition-colors">
                <Headset className="w-4 h-4 text-white group-hover:text-brand-600" />
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
            {/* Header: Initial is RANDEVORY Destek Masası; Once connected, switches to assigned agent! */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-900 text-white p-3.5 sm:p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                {assignedAgent ? (
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${assignedAgent.avatarColor} flex items-center justify-center shrink-0 shadow-inner relative text-white font-black text-base ring-2 ring-white/20`}
                  >
                    {assignedAgent.avatarLetter}
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900 shadow-xs" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shrink-0 shadow-inner relative ring-2 ring-white/20">
                    <Headset className="w-5 h-5 text-white" />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900 shadow-xs" />
                  </div>
                )}

                <div>
                  <h3 className="font-black text-sm tracking-tight text-white flex items-center gap-1.5">
                    {assignedAgent ? assignedAgent.name : 'RANDEVORY Canlı Destek'}
                  </h3>
                  <p className="text-[11px] text-emerald-400 font-semibold truncate max-w-[205px] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                    {assignedAgent ? `${assignedAgent.title} • Çevrimiçi` : 'Çevrimiçi • 7/24 Yanıt Masası'}
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
                  onClick={handleCloseWidget}
                  title="Sohbeti Kapat ve Sıfırla"
                  className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex flex-col h-[min(480px,calc(100dvh-8rem))]">
              <div
                ref={chatContainerRef}
                className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3 bg-slate-50 pt-3"
              >
                {/* Status Bar */}
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between shadow-2xs">
                  <span className="truncate max-w-[180px] font-medium text-slate-700">
                    Sohbet: <strong>{activeTicket?.sender_name || senderName}</strong>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                    {assignedAgent ? `${assignedAgent.name} ile Canlı Görüşme` : 'Canlı Destek Masası'}
                  </span>
                </div>

                {/* All Chat Bubbles */}
                {displayedMessages.map((msg, idx) => {
                  if (msg.sender === 'system') {
                    if (msg.isRatingCard) {
                      return (
                        <div key={idx} className="my-3 p-3.5 rounded-2xl bg-white border border-amber-200/90 shadow-md">
                          <div className="text-center space-y-1">
                            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto text-base">
                              ⭐
                            </div>
                            <h4 className="text-xs font-black text-slate-800">Canlı Destek Görüşmesini Puanlayın</h4>
                            <p className="text-[11px] text-slate-500">
                              {assignedAgent ? `${assignedAgent.name} ile` : 'Destek masasıyla'} olan görüşmenizi nasıl değerlendirirsiniz?
                            </p>
                          </div>

                          {ratingSubmitted ? (
                            <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                              <span className="text-xs font-bold text-emerald-800">
                                ✅ Değerlendirmeniz kaydedildi. Teşekkür ederiz!
                              </span>
                            </div>
                          ) : (
                            <div className="mt-3 space-y-2.5">
                              {/* Interactive Stars */}
                              <div className="flex items-center justify-center gap-1.5 py-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setSelectedRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    className="p-1 transition-transform hover:scale-125 focus:outline-none"
                                  >
                                    <Star
                                      className={`w-6 h-6 transition-colors ${
                                        star <= (hoverRating || selectedRating)
                                          ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                                          : 'text-slate-300'
                                      }`}
                                    />
                                  </button>
                                ))}
                              </div>

                              {/* Quick tags */}
                              <div className="flex flex-wrap gap-1 justify-center">
                                {['Hızlı Çözüm ⚡', 'Kibar & İlgili ✨', 'Sorunum Çözüldü ✅', 'Geliştirilmeli 💬'].map(
                                  (tag) => (
                                    <button
                                      key={tag}
                                      type="button"
                                      onClick={() => {
                                        setSelectedTags((prev) =>
                                          prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                                        );
                                      }}
                                      className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${
                                        selectedTags.includes(tag)
                                          ? 'bg-amber-500 text-white border-amber-600 font-bold'
                                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                      }`}
                                    >
                                      {tag}
                                    </button>
                                  )
                                )}
                              </div>

                              {/* Feedback input */}
                              <input
                                type="text"
                                placeholder="Görüşünüzü paylaşın (İsteğe bağlı)..."
                                value={ratingNote}
                                onChange={(e) => setRatingNote(e.target.value)}
                                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                              />

                              <button
                                type="button"
                                disabled={selectedRating === 0}
                                onClick={handleSendRating}
                                className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-all"
                              >
                                Değerlendirmeyi Gönder
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div key={idx} className="flex justify-center my-2">
                        <span className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-[11px] font-bold text-indigo-800 shadow-2xs flex items-center gap-1.5 animate-in fade-in">
                          {msg.text}
                        </span>
                      </div>
                    );
                  }

                  const isUser = msg.sender === 'user';
                  const repName = msg.agent_name || (assignedAgent ? assignedAgent.name : 'Destek Masası');

                  // Okundu / Gönderildi durumu:
                  // Kullanıcı mesajından sonra gelen bir yanıt varsa VEYA okuma zamanı dolmuşsa "Okundu"
                  const hasReplyAfter = displayedMessages.slice(idx + 1).some((m) => m.sender !== 'user');
                  const isTimestampRead = msg.created_at ? readMessageTimestamps.includes(msg.created_at) : false;
                  const isRead = hasReplyAfter || isTimestampRead;

                  return (
                    <div
                      key={idx}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-xs ${
                          isUser
                            ? 'bg-brand-600 text-white rounded-tr-xs'
                            : 'bg-white border border-slate-200 text-slate-900 rounded-tl-xs'
                        }`}
                      >
                        {!isUser && (
                          <div className="font-extrabold text-[11px] text-slate-800 flex items-center gap-1.5 mb-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                            <span>{repName} • Müşteri Temsilcisi</span>
                          </div>
                        )}

                        {msg.image_url && (
                          <div className="mb-2">
                            <img
                              src={msg.image_url}
                              alt="Gönderilen Görsel"
                              onClick={() => setLightboxImage(msg.image_url || null)}
                              className="rounded-xl max-h-48 w-auto object-cover border border-slate-200 cursor-zoom-in hover:opacity-95 transition-opacity"
                            />
                          </div>
                        )}

                        <p className="whitespace-pre-wrap">{msg.text}</p>

                        {/* Options buttons in initial state */}
                        {!activeTicket && msg.options && msg.options.length > 0 && (
                          <div className="mt-3 space-y-1.5">
                            {msg.options.map((opt) => (
                              <button
                                key={opt.id}
                                type="button"
                                disabled={sending}
                                onClick={() => handleOptionClick(opt.id, opt.label)}
                                className={`w-full text-left px-3 py-2 rounded-xl border text-[11px] flex items-center justify-between transition-all ${
                                  opt.id === 'connect_human'
                                    ? 'bg-slate-900 hover:bg-slate-800 text-white font-bold border-slate-800 shadow-xs mt-2'
                                    : 'bg-slate-50 hover:bg-brand-50 border-slate-200 hover:border-brand-300 text-slate-800 hover:text-brand-700 font-semibold'
                                }`}
                              >
                                <span>{opt.label}</span>
                                <ChevronRight
                                  className={`w-3.5 h-3.5 shrink-0 ${
                                    opt.id === 'connect_human' ? 'text-emerald-400' : 'text-slate-400'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Quick feedback buttons */}
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
                                Diğer Konular
                              </button>
                            </div>
                            <button
                              type="button"
                              disabled={sending}
                              onClick={() => connectToHumanRepresentative()}
                              className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-xs"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              👩‍💼 Canlı Müşteri Temsilcisine Bağlan
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Timestamp & Read/Sent Status Tick Bar */}
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1 px-1">
                        <span>
                          {msg.created_at
                            ? new Date(msg.created_at).toLocaleTimeString('tr-TR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </span>

                        {isUser && (
                          <span className="flex items-center gap-0.5 ml-1">
                            {isRead ? (
                              <span className="inline-flex items-center gap-0.5 text-emerald-600 font-semibold" title="Temsilci Tarafından Okundu">
                                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-[9px]">Okundu</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-slate-400" title="Mesaj İletildi">
                                <Check className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-[9px]">Gönderildi</span>
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Realistic Typing Animation */}
                {isAgentTyping && (
                  <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-white border border-slate-200 shadow-2xs max-w-[240px] animate-in fade-in slide-in-from-bottom-2">
                    {assignedAgent ? (
                      <div
                        className={`w-6 h-6 rounded-lg bg-gradient-to-tr ${assignedAgent.avatarColor} text-white font-extrabold text-[10px] flex items-center justify-center shrink-0`}
                      >
                        {assignedAgent.avatarLetter}
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-lg bg-brand-600 text-white flex items-center justify-center shrink-0">
                        <Headset className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
                      <span>{currentAgentName} yazıyor</span>
                      <span className="flex items-center gap-0.5 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" />
                      </span>
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

              {/* Bottom Message Bar */}
              {activeTicket?.status === 'closed' || isTerminatedByAgent ? (
                <div className="p-3.5 bg-slate-50 border-t border-slate-200 text-center space-y-2.5">
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs">
                    <span>🛑</span> Bu destek görüşmesi sonlandırılmıştır.
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Yeni bir destek talebinde bulunmak için lütfen kurumsal iletişim kurallarına dikkat ediniz.
                  </div>
                  <button
                    type="button"
                    onClick={handleStartNewConversation}
                    className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-xs transition-all"
                  >
                    Yeni Sohbet Başlat
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
                    placeholder={
                      assignedAgent
                        ? `${assignedAgent.name}'e mesajınızı yazın...`
                        : 'Destek ekibine mesajınızı yazın...'
                    }
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
