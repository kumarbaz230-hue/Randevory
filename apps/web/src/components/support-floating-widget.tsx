'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Headset,
  X,
  Send,
  ShieldAlert,
  Clock,
  Megaphone,
  MessageCircle,
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
import { buildWhatsAppUrl } from '@/lib/whatsapp-helper';

export interface SupportChatMessage {
  sender: 'user' | 'admin';
  text: string;
  image_url?: string | null;
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

interface AiChatBubble {
  sender: 'ai' | 'user';
  text: string;
  options?: Array<{ id: string; label: string; category?: string }>;
  showSolvedActions?: boolean;
}

const ACTIVE_TICKET_STORAGE_KEY = 'randevory_active_support_ticket_id';

const ROOT_AI_OPTIONS = [
  { id: 'cat_app_error', label: '🛠️ Uygulama / Site Hatası Yaşıyorum' },
  { id: 'cat_booking', label: '📅 Randevu Alma veya İptal Sorunu' },
  { id: 'cat_qr_wp', label: '📱 WhatsApp, QR Kod & Vitrin Afişi' },
  { id: 'cat_billing', label: '💳 Paketler, Abonelik & Ödeme' },
  { id: 'cat_complaint', label: '🚨 Şüpheli / Güvenilir Olmayan İşletme Şikayeti' },
];

const SUB_AI_OPTIONS: Record<string, Array<{ id: string; label: string }>> = {
  cat_app_error: [
    { id: 'sol_link_error', label: '🔗 İşletme linkim açılmıyor / Bulunamadı diyor' },
    { id: 'sol_slots_empty', label: '⏰ Takvimde müsait saatler görünmüyor' },
    { id: 'sol_login_issue', label: '🔑 Şifremi unuttum veya giriş yapamıyorum' },
    { id: 'sol_staff_service', label: '👥 Personel veya hizmet ekleyemiyorum' },
  ],
  cat_booking: [
    { id: 'sol_cancel_apt', label: '❌ Aldığım randevuyu nasıl iptal ederim?' },
    { id: 'sol_no_time', label: '📅 İstediğim saat listede neden yok?' },
    { id: 'sol_chat_biz', label: '💬 İşletmeye nasıl mesaj atabilirim?' },
  ],
  cat_qr_wp: [
    { id: 'sol_qr_download', label: '🖨️ QR Kod ve Vitrin Afişini nereden indiririm?' },
    { id: 'sol_wp_msg', label: '📲 WhatsApp bildirimleri nasıl çalışıyor?' },
  ],
  cat_billing: [
    { id: 'sol_upgrade', label: '👑 Ücretli pakete nasıl geçiş yaparım?' },
    { id: 'sol_free_limits', label: '🎁 Ücretsiz paketin limitleri nelerdir?' },
  ],
};

const AI_SOLUTIONS: Record<string, { title: string; answer: string; category: 'support' | 'complaint' | 'billing' | 'suggestion' }> = {
  sol_link_error: {
    title: 'İşletme Linki Sorunu',
    category: 'support',
    answer:
      'Çözüm Adımları:\n1. Yönetim Panelinde sol menüden "İşletme Ayarları" sayfasına gidin.\n2. "Özel Bağlantı Kodu (Slug)" kısmında boşluk veya özel karakter olmadığından emin olup "Değişiklikleri Kaydet" butonuna basın.\n3. Sistem Türkçe karakterleri otomatik düzeltecek ve "Sayfayı Gör" butonunuz anında güncellenecektir.',
  },
  sol_slots_empty: {
    title: 'Takvimde Saat Görünmeme Sorunu',
    category: 'support',
    answer:
      'Müşteri ekranında saatlerin görünmesi için şu 3 ayarı kontrol edin:\n1. İşletme Ayarları > Çalışma Saatleri kısmında ilgili günün "Açık" olduğundan emin olun.\n2. Personel Yönetimi sayfasında en az 1 aktif personeliniz bulunsun ve hizmetleriniz bu personele işaretlenmiş olsun.\n3. Seçilen gün için tüm saatler zaten doluysa çakışma önleme motoru dolu saatleri gizler.',
  },
  sol_login_issue: {
    title: 'Giriş ve Şifre Sorunu',
    category: 'support',
    answer:
      '• Şifrenizi unuttuysanız Giriş Yap (/login) ekranındaki "Şifremi Unuttum" bağlantısına tıklayarak e-postanıza sıfırlama linki gönderebilirsiniz.\n• Sürekli tekrar giriş yapmamak için giriş ekranındaki "Beni Hatırla (Oturumumu açık tut)" kutucuğunu işaretleyin.',
  },
  sol_staff_service: {
    title: 'Personel ve Hizmet Ekleme Limitleri',
    category: 'billing',
    answer:
      'Ücretsiz Başlangıç paketinde 1 Personel ve 5 Hizmet tanımlanabilir. Daha fazla personel veya hizmet eklemek için sol menüden "Abonelik & Lisans" sayfasına giderek Standart veya Profesyonel pakete geçebilirsiniz.',
  },
  sol_cancel_apt: {
    title: 'Randevu Sorgulama ve İptal',
    category: 'support',
    answer:
      'Randevu aldığınız işletmenin sayfasına (randevory.com/isletme-adi) girin:\n1. Üstteki sekmelerden "Randevu Sorgula / İptal" sekmesine tıklayın.\n2. Randevu alırken yazdığınız telefon numarasını girin.\n3. Aktif randevunuzun yanındaki "Randevuyu İptal Et" butonuna basarak saniyeler içinde iptal edebilirsiniz.',
  },
  sol_no_time: {
    title: 'Müsait Saatlerin Görünmesi',
    category: 'support',
    answer:
      'RANDEVORY Çakışma Önleme Motoru, başka bir müşterinin aldığı saatleri otomatik olarak listeden kaldırır. Farklı bir gün veya "Fark Etmez (İlk Müsait Uzman)" seçeneğini deneyebilirsiniz.',
  },
  sol_chat_biz: {
    title: 'İşletmeyle Canlı Sohbet',
    category: 'support',
    answer:
      'Randevu aldığınız işletmenin sayfasındaki "İşletmeye Mesaj Yaz" sekmesine tıklayarak veya randevu onay ekranındaki "WhatsApp ile Gönder" butonuna basarak işletmeyle doğrudan iletişim kurabilirsiniz.',
  },
  sol_qr_download: {
    title: 'QR Kod ve Vitrin Afişi İndirme',
    category: 'support',
    answer:
      'Yönetim Panelinde sol menüdeki veya üst bardaki "QR Kod & Afiş İndir" butonuna tıklayın:\n• "Vitrin Afişi İndir (PNG)" butonuyla baskıya hazır 1080x1350 poster indirebilir,\n• "Sadece QR Kod İndir" butonuyla yüksek çözünürlüklü karekod alabilirsiniz.',
  },
  sol_wp_msg: {
    title: 'WhatsApp Bildirim Sistemi',
    category: 'support',
    answer:
      '• Müşteri randevu aldığında ekranda "İşletmeye WhatsApp\'tan Bildir" butonu çıkar.\n• İşletme sahibi ise Takvim veya Genel Bakış ekranında randevuyu onayladığında "WhatsApp Onay Mesajı Gönder" kartıyla hazır metni tek tuşla müşteriye iletebilir.',
  },
  sol_upgrade: {
    title: 'Paket Yükseltme ve Ödeme',
    category: 'billing',
    answer:
      'Yönetim Paneli > Abonelik & Lisans (/dashboard/billing) sayfasından ihtiyacınıza uygun paketi seçip 3D Secure güvencesiyle yükseltebilir veya canlı destekten kurucu ekibimize yazabilirsiniz.',
  },
  sol_free_limits: {
    title: 'Ücretsiz Paket Özellikleri',
    category: 'billing',
    answer:
      'Ücretsiz Başlangıç Paketi (0 ₺/ay): 1 Personel, 5 Hizmet, Aylık 50 Randevu, Özel Randevu Linki, QR Kod & Vitrin Afişi ve Canlı Müşteri Sohbeti özelliklerini içerir.',
  },
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
        const compressed = canvas.toDataURL('image/jpeg', 0.78);
        resolve(compressed);
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

  // Mode when no activeTicket exists: 'ai' (AI Assistant first) or 'human_form' (Connect to Live Agent)
  const [widgetStage, setWidgetStage] = useState<'ai' | 'human_form'>('ai');

  // AI Assistant Conversation State
  const [aiBubbles, setAiBubbles] = useState<AiChatBubble[]>([
    {
      sender: 'ai',
      text: 'Merhaba! 👋 Ben RANDEVORY Yapay Zeka Destek Asistanıyım.\n\nMüşteri temsilcimize bağlanmadan önce sorununuzu saniyeler içinde çözebilmem için lütfen aşağıdan bir konu seçin veya sorunuzu yazın:',
      options: ROOT_AI_OPTIONS,
    },
  ]);
  const [aiInput, setAiInput] = useState('');

  // Global announcement banner from platform_settings
  const [announcementActive, setAnnouncementActive] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');
  const [supportWhatsapp, setSupportWhatsapp] = useState('');
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Active Live Support Ticket (human representative chat)
  const [activeTicket, setActiveTicket] = useState<SupportTicketRow | null>(null);
  const [replyInput, setReplyInput] = useState('');
  const [replyImagePreview, setReplyImagePreview] = useState<string | null>(null);
  const [sendingReply, setSendingReply] = useState(false);

  // New Ticket Form (for connecting to live agent)
  const [category, setCategory] = useState<'support' | 'complaint' | 'billing' | 'suggestion'>('support');
  const [senderName, setSenderName] = useState('');
  const [senderContact, setSenderContact] = useState('');
  const [reportedBusiness, setReportedBusiness] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [formImagePreview, setFormImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fullscreen Image Lightbox
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const aiEndRef = useRef<HTMLDivElement>(null);
  const formFileInputRef = useRef<HTMLInputElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

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

  // Poll active ticket every 3 seconds when widget is open
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

  useEffect(() => {
    if (isOpen && !activeTicket && widgetStage === 'ai') {
      aiEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, activeTicket, widgetStage, aiBubbles.length]);

  // Handle AI Option Selection
  const handleAiOptionClick = (optId: string, optLabel: string) => {
    if (optId === 'cat_complaint') {
      setCategory('complaint');
      setSubject('Şüpheli / Güvenilir Olmayan İşletme Bildirimi');
      setWidgetStage('human_form');
      return;
    }

    if (SUB_AI_OPTIONS[optId]) {
      setAiBubbles((prev) => [
        ...prev,
        { sender: 'user', text: optLabel },
        {
          sender: 'ai',
          text: 'Lütfen yaşadığınız durumu daha net seçin:',
          options: SUB_AI_OPTIONS[optId],
        },
      ]);
      return;
    }

    const sol = AI_SOLUTIONS[optId];
    if (sol) {
      setCategory(sol.category);
      setSubject(sol.title);
      setAiBubbles((prev) => [
        ...prev,
        { sender: 'user', text: optLabel },
        {
          sender: 'ai',
          text: `🤖 **${sol.title} – Çözüm Rehberi:**\n\n${sol.answer}`,
          showSolvedActions: true,
        },
      ]);
    }
  };

  // Handle Free-Text Question to AI Assistant
  const handleAiFreeTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = aiInput.trim();
    if (!q) return;
    setAiInput('');

    const lower = q.toLowerCase();
    let matchedKey: string | null = null;

    if (lower.includes('link') || lower.includes('bulunamadı') || lower.includes('açılmıyor') || lower.includes('slug')) {
      matchedKey = 'sol_link_error';
    } else if (lower.includes('saat') || lower.includes('takvim') || lower.includes('müsait') || lower.includes('kapalı')) {
      matchedKey = 'sol_slots_empty';
    } else if (lower.includes('şifre') || lower.includes('giriş') || lower.includes('hesap')) {
      matchedKey = 'sol_login_issue';
    } else if (lower.includes('iptal')) {
      matchedKey = 'sol_cancel_apt';
    } else if (lower.includes('qr') || lower.includes('afiş') || lower.includes('poster') || lower.includes('karekod')) {
      matchedKey = 'sol_qr_download';
    } else if (lower.includes('whatsapp') || lower.includes('wp') || lower.includes('sms') || lower.includes('bildirim')) {
      matchedKey = 'sol_wp_msg';
    } else if (lower.includes('paket') || lower.includes('ücret') || lower.includes('fiyat') || lower.includes('ödeme')) {
      matchedKey = 'sol_upgrade';
    } else if (lower.includes('şikayet') || lower.includes('dolandırıcı') || lower.includes('güvenilir') || lower.includes('yasak')) {
      setCategory('complaint');
      setSubject('Şüpheli İşletme / Kullanıcı Şikayeti');
      setMessage(q);
      setAiBubbles((prev) => [
        ...prev,
        { sender: 'user', text: q },
        {
          sender: 'ai',
          text: '🚨 Güvenlik ve şikayet bildirimleriniz doğrudan Kurucu & Güvenlik Ekibimiz tarafından incelenir. Sizi hemen canlı müşteri temsilcimize aktarıyorum.',
          showSolvedActions: true,
        },
      ]);
      return;
    }

    if (matchedKey && AI_SOLUTIONS[matchedKey]) {
      const sol = AI_SOLUTIONS[matchedKey];
      setCategory(sol.category);
      setSubject(sol.title);
      setMessage(q);
      setAiBubbles((prev) => [
        ...prev,
        { sender: 'user', text: q },
        {
          sender: 'ai',
          text: `🤖 **${sol.title} İçin Önerilen Çözüm:**\n\n${sol.answer}`,
          showSolvedActions: true,
        },
      ]);
    } else {
      setSubject(q.slice(0, 60));
      setMessage(q);
      setAiBubbles((prev) => [
        ...prev,
        { sender: 'user', text: q },
        {
          sender: 'ai',
          text: 'Sorunuzu kaydettim! Bu konuda size en doğru yardımı sunabilmemiz için aşağıdaki **"👨‍💻 Müşteri Temsilcisine Bağlan"** butonuna tıklayarak canlı destek ekibimizle (fotoğraf da ekleyerek) hemen görüşebilirsiniz.',
          showSolvedActions: true,
        },
      ]);
    }
  };

  const handleResetAi = () => {
    setAiBubbles([
      {
        sender: 'ai',
        text: 'Size başka hangi konuda yardımcı olabilirim? Aşağıdan bir başlık seçebilir veya direkt müşteri temsilcimize bağlanabilirsiniz:',
        options: ROOT_AI_OPTIONS,
      },
    ]);
  };

  const handleSelectImageForForm = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageToDataUrl(file);
      setFormImagePreview(dataUrl);
    } catch {
      alert('Fotoğraf yüklenirken bir hata oluştu.');
    }
    e.target.value = '';
  };

  const handleSelectImageForChat = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageToDataUrl(file);
      setReplyImagePreview(dataUrl);
    } catch {
      alert('Fotoğraf yüklenirken bir hata oluştu.');
    }
    e.target.value = '';
  };

  const handleStartSupportChat = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!senderName.trim() || !senderContact.trim() || !subject.trim() || (!message.trim() && !formImagePreview)) {
      setErrorMsg('Lütfen adınızı, iletişim bilginizi ve mesajınızı (veya fotoğrafınızı) girin.');
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const cleanMsg = message.trim() || '📷 [Fotoğraf Gönderildi]';
      const firstMessageObj: SupportChatMessage = {
        sender: 'user',
        text: cleanMsg,
        image_url: formImagePreview || null,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('platform_support_tickets')
        .insert({
          sender_name: senderName.trim(),
          sender_contact: senderContact.trim(),
          category,
          subject: subject.trim(),
          message: cleanMsg,
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
      setFormImagePreview(null);
      setReportedBusiness('');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Destek sohbeti başlatılırken bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendFollowUpMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || (!replyInput.trim() && !replyImagePreview) || sendingReply) return;

    const textToSend = replyInput.trim();
    const imgToSend = replyImagePreview;
    setSendingReply(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('user_send_support_message', {
        p_ticket_id: activeTicket.id,
        p_message: textToSend,
        p_image_url: imgToSend || null,
      });

      if (error) throw error;

      if (data) {
        setActiveTicket(data as SupportTicketRow);
      } else {
        await fetchActiveTicketById(activeTicket.id);
      }
      setReplyInput('');
      setReplyImagePreview(null);
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
    setReplyImagePreview(null);
    setErrorMsg(null);
    setWidgetStage('ai');
    handleResetAi();
  };

  const lastMessage = chatMessages[chatMessages.length - 1];
  const isWaitingForAdmin = activeTicket?.status !== 'closed' && lastMessage?.sender === 'user';

  return (
    <>
      {/* Global Top Announcement Banner */}
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
                AI Asistan & Canlı Destek
              </div>
              <div className="text-xs font-extrabold leading-tight mt-0.5">
                Canlı Destek / Bildir
              </div>
            </div>
          </button>
        )}

        {/* Support Modal / Live Chat Drawer */}
        {isOpen && (
          <div className="w-[365px] sm:w-[420px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-900 text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shrink-0 shadow-inner relative">
                  {activeTicket || widgetStage === 'human_form' ? (
                    <Headset className="w-5 h-5 text-white" />
                  ) : (
                    <Bot className="w-5 h-5 text-white" />
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                    {activeTicket
                      ? 'Müşteri Temsilcisi (Canlı)'
                      : widgetStage === 'human_form'
                      ? 'Müşteri Temsilcisine Bağlan'
                      : 'RANDEVORY AI Destek Asistanı'}
                  </h3>
                  <p className="text-[11px] text-slate-300 truncate max-w-[200px]">
                    {activeTicket
                      ? `Konu: ${activeTicket.subject}`
                      : 'Yapay Zeka & 7/24 Canlı Temsilci'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {(activeTicket || widgetStage === 'human_form') && (
                  <button
                    type="button"
                    onClick={handleStartNewTopic}
                    title="AI Asistana Dön / Yeni Konu"
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> AI / Yeni
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

            {/* STAGE 1: ACTIVE HUMAN LIVE CHAT ROOM */}
            {activeTicket ? (
              <div className="flex flex-col h-[450px]">
                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                    <span>
                      Kullanıcı: <strong>{activeTicket.sender_name}</strong>
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
                        ? 'Temsilci Yanıtladı'
                        : 'Temsilci Bekleniyor'}
                    </span>
                  </div>

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
                              RANDEVORY Müşteri Temsilcisi
                            </div>
                          )}
                          {msg.image_url && (
                            <div className="mb-2">
                              <img
                                src={msg.image_url}
                                alt="Eklenen Görsel"
                                onClick={() => setLightboxImage(msg.image_url || null)}
                                className="rounded-xl max-h-48 w-auto object-cover border border-white/20 cursor-zoom-in hover:opacity-95 transition-opacity"
                              />
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

                  {isWaitingForAdmin && (
                    <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2.5 animate-pulse">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold">Müşteri temsilcimiz mesajınızı inceliyor...</div>
                        <div className="text-amber-700 mt-0.5">
                          Bu ekranda bekleyebilirsiniz; temsilcimiz yanıt yazdığında anında buraya düşecektir.
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Image Preview Bar before sending in chat */}
                {replyImagePreview && (
                  <div className="px-3 py-2 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={replyImagePreview}
                        alt="Önizleme"
                        className="w-10 h-10 rounded-lg object-cover border border-slate-300"
                      />
                      <span className="text-[11px] font-semibold text-slate-700">
                        Fotoğraf eklendi (Göndermeye hazır)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyImagePreview(null)}
                      className="text-rose-600 hover:text-rose-700 p-1 text-xs font-bold"
                    >
                      Kaldır
                    </button>
                  </div>
                )}

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
                      ref={chatFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleSelectImageForChat}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => chatFileInputRef.current?.click()}
                      title="Fotoğraf / Ekran Görüntüsü Gönder"
                      className="p-2.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 shrink-0 transition-colors"
                    >
                      <ImagePlus className="w-4 h-4 text-brand-600" />
                    </button>
                    <input
                      type="text"
                      placeholder="Mesajınızı yazın veya 📷 fotoğraf ekleyin..."
                      value={replyInput}
                      onChange={(e) => setReplyInput(e.target.value)}
                      className="flex-1 px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <button
                      type="submit"
                      disabled={sendingReply || (!replyInput.trim() && !replyImagePreview)}
                      className="px-3.5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center gap-1 shrink-0 disabled:opacity-50 transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Gönder
                    </button>
                  </form>
                )}
              </div>
            ) : widgetStage === 'ai' ? (
              /* STAGE 2: AI ASSISTANT WITH QUICK CHOICES + DIRECT CONNECT TO REPRESENTATIVE */
              <div className="flex flex-col h-[470px]">
                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
                  {aiBubbles.map((b, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col ${b.sender === 'ai' ? 'items-start' : 'items-end'}`}
                    >
                      <div
                        className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                          b.sender === 'ai'
                            ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
                            : 'bg-brand-600 text-white rounded-tr-sm'
                        }`}
                      >
                        {b.sender === 'ai' && (
                          <div className="font-extrabold text-[10px] uppercase tracking-wider text-brand-600 flex items-center gap-1 mb-1">
                            <Sparkles className="w-3 h-3" /> RANDEVORY AI Asistan
                          </div>
                        )}
                        <p className="whitespace-pre-wrap">{b.text}</p>

                        {/* Selectable Quick Options */}
                        {b.options && b.options.length > 0 && (
                          <div className="mt-3 space-y-1.5">
                            {b.options.map((opt) => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => handleAiOptionClick(opt.id, opt.label)}
                                className="w-full text-left px-3 py-2 rounded-xl bg-slate-50 hover:bg-brand-50 border border-slate-200 hover:border-brand-300 text-slate-800 hover:text-brand-700 font-semibold text-[11px] flex items-center justify-between transition-all"
                              >
                                <span>{opt.label}</span>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Solved / Connect to Representative Actions */}
                        {b.showSolvedActions && (
                          <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                            <div className="text-[10px] font-bold text-slate-400 uppercase">
                              Bu yanıt sorununuzu çözdü mü?
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  setAiBubbles((prev) => [
                                    ...prev,
                                    {
                                      sender: 'user',
                                      text: '✅ Teşekkürler, sorunum çözüldü!',
                                    },
                                    {
                                      sender: 'ai',
                                      text: 'Harika! 😊 Başka bir sorunuz olursa her zaman buradayım.',
                                    },
                                  ])
                                }
                                className="px-2.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[11px] flex items-center justify-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Çözüldü
                              </button>
                              <button
                                type="button"
                                onClick={handleResetAi}
                                className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center justify-center gap-1"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Başka Konu Seç
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => setWidgetStage('human_form')}
                              className="w-full py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-sm"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              Çözülmedi, Müşteri Temsilcisine Bağlan
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={aiEndRef} />
                </div>

                {/* Direct "Connect to Customer Representative" Bar + AI Free-Text Input */}
                <div className="p-3 bg-white border-t border-slate-200 space-y-2">
                  <button
                    type="button"
                    onClick={() => setWidgetStage('human_form')}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    Direkt Müşteri Temsilcisine Bağlan (Mesaj & Fotoğraf)
                  </button>

                  <form onSubmit={handleAiFreeTextSubmit} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Veya sorunuzu yapay zekaya yazın..."
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <button
                      type="submit"
                      disabled={!aiInput.trim()}
                      className="px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs disabled:opacity-50"
                    >
                      Sor
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              /* STAGE 3: CONNECT TO HUMAN REPRESENTATIVE FORM (WITH PHOTO UPLOAD) */
              <div className="p-4 max-h-[460px] overflow-y-auto">
                <form onSubmit={handleStartSupportChat} className="space-y-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-brand-50 border border-brand-200 text-brand-900 flex items-center justify-between">
                    <span className="font-bold text-[11px] flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-brand-600" />
                      Canlı Müşteri Temsilcisi Bağlantı Formu
                    </span>
                    <button
                      type="button"
                      onClick={() => setWidgetStage('ai')}
                      className="text-[11px] text-brand-700 font-bold hover:underline"
                    >
                      &larr; AI Şıklarına Dön
                    </button>
                  </div>

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
                      placeholder="Yaşadığınız sorunu müşteri temsilcimize yazın..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                  </div>

                  {/* Photo Upload Button & Preview */}
                  <div>
                    <input
                      ref={formFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleSelectImageForForm}
                      className="hidden"
                    />
                    {formImagePreview ? (
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={formImagePreview}
                            alt="Yüklenen Fotoğraf"
                            className="w-12 h-12 rounded-lg object-cover border border-slate-300"
                          />
                          <div>
                            <div className="font-bold text-slate-800 text-[11px]">
                              📷 Ekran Görüntüsü / Fotoğraf Eklendi
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Mesajınızla birlikte temsilciye iletilecek
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormImagePreview(null)}
                          className="text-rose-600 hover:text-rose-700 font-bold text-xs px-2 py-1"
                        >
                          Kaldır
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => formFileInputRef.current?.click()}
                        className="w-full py-2 px-3 rounded-xl border border-dashed border-slate-300 hover:border-brand-400 bg-slate-50 hover:bg-brand-50/40 text-slate-700 font-semibold flex items-center justify-center gap-2 transition-colors"
                      >
                        <ImagePlus className="w-4 h-4 text-brand-600" />
                        📷 Fotoğraf veya Ekran Görüntüsü Ekle (Opsiyonel)
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {submitting ? 'Temsilciye Bağlanılıyor...' : 'Müşteri Temsilcisine Bağlan & Gönder'}
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
