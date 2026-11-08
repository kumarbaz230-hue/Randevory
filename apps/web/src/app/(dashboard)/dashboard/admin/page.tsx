'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  ShieldCheck,
  ShieldAlert,
  Building2,
  Headset,
  Calendar,
  Megaphone,
  Search,
  Ban,
  CheckCircle2,
  ExternalLink,
  Crown,
  Send,
  RefreshCw,
  Users,
  AlertTriangle,
  MessageCircle,
  XCircle,
  ImagePlus,
  Link2,
  KeyRound,
  Wrench,
  Clock,
  Gift,
  QrCode,
  Sparkles,
  Copy,
  ChevronLeft,
  X,
  Eye,
} from 'lucide-react';
import { buildWhatsAppUrl } from '@/lib/whatsapp-helper';

interface AdminBusinessRow {
  id: string;
  name: string;
  slug: string;
  sector: string;
  city: string;
  district: string | null;
  phone: string;
  email: string | null;
  subscription_plan: 'free' | 'standard' | 'pro' | 'enterprise';
  subscription_end?: string | null;
  subscription_status?: string | null;
  is_active: boolean;
  ban_reason: string | null;
  created_at: string;
  owner_email: string | null;
  owner_name: string | null;
  appointment_count: number;
  staff_count: number;
}

interface AdminTicketRow {
  id: string;
  sender_name: string;
  sender_contact: string;
  category: string;
  subject: string;
  message: string;
  reported_business_slug: string | null;
  status: 'open' | 'answered' | 'closed';
  admin_reply: string | null;
  messages?: Array<{
    sender: 'user' | 'admin' | 'ai';
    text: string;
    image_url?: string | null;
    created_at: string;
  }>;
  replied_at: string | null;
  created_at: string;
}

interface AdminAppointmentRow {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  total_price: number;
  customer_notes: string | null;
  customer_name: string;
  customer_phone: string;
  created_at: string;
  business_name: string | null;
  business_slug: string | null;
  service_name: string | null;
}

export default function SuperAdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'businesses' | 'tickets' | 'appointments' | 'settings'>('tickets');

  // Data state
  const [totalUsers, setTotalUsers] = useState(0);
  const [businesses, setBusinesses] = useState<AdminBusinessRow[]>([]);
  const [tickets, setTickets] = useState<AdminTicketRow[]>([]);
  const [appointments, setAppointments] = useState<AdminAppointmentRow[]>([]);

  // Filters
  const [bizSearch, setBizSearch] = useState('');
  const [bizFilter, setBizFilter] = useState<'all' | 'active' | 'banned'>('all');
  const [ticketFilter, setTicketFilter] = useState<'all' | 'open' | 'complaint'>('all');
  const [ticketSearch, setTicketSearch] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showQuickTools, setShowQuickTools] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Ticket reply state & selected business per ticket for quick link pulling
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyImages, setReplyImages] = useState<Record<string, string>>({});
  const [selectedBizForTicket, setSelectedBizForTicket] = useState<Record<string, string>>({});
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  // Ban modal state
  const [banModalBiz, setBanModalBiz] = useState<AdminBusinessRow | null>(null);
  const [banReasonInput, setBanReasonInput] = useState(
    'Güvenilir olmayan içerik veya kullanım koşulları ihlali nedeniyle RANDEVORY Destek Ekibi tarafından askıya alınmıştır.'
  );

  // License grant modal state
  const [licenseModalBiz, setLicenseModalBiz] = useState<AdminBusinessRow | null>(null);
  const [selectedGrantTier, setSelectedGrantTier] = useState<'standard' | 'pro' | 'enterprise' | 'free'>('standard');
  const [selectedGrantMonths, setSelectedGrantMonths] = useState<number>(1);
  const [licenseTicketReply, setLicenseTicketReply] = useState<AdminTicketRow | null>(null);

  // Global Platform Settings
  const [announcementActive, setAnnouncementActive] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');
  const [supportWhatsapp, setSupportWhatsapp] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4500);
  };

  const loadAdminOverview = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('admin_get_overview');

      if (error) {
        setAuthorized(false);
        setErrorMsg(error.message || 'Bu sayfaya erişim yetkiniz bulunmuyor.');
        return;
      }

      setAuthorized(true);
      const payload = data as any;
      setTotalUsers(payload?.total_users || 0);
      setBusinesses(payload?.businesses || []);
      setTickets(payload?.tickets || []);
      setAppointments(payload?.appointments || []);

      if (payload?.settings) {
        setAnnouncementActive(Boolean(payload.settings.announcement_active));
        setAnnouncementText(payload.settings.announcement_text || '');
        setSupportWhatsapp(payload.settings.support_whatsapp || '');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Veriler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdminOverview();
  }, [loadAdminOverview]);

  // Destek sekmesindeyken karşı taraftan gelen yeni mesajları 4 saniyede bir canlı yenile
  useEffect(() => {
    if (!authorized || activeTab !== 'tickets') return;
    const timer = setInterval(async () => {
      const supabase = createClient();
      const { data } = await supabase.rpc('admin_get_overview');
      if (data && (data as any).tickets) {
        setTickets((data as any).tickets);
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [authorized, activeTab]);

  // Destek mesajı değiştiğinde veya yeni bilet seçildiğinde en alta kaydır
  useEffect(() => {
    if (activeTab === 'tickets') {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [activeTab, selectedTicketId, tickets]);

  // Find matching business for a ticket automatically (by owner_email or name)
  const getMatchedBusinessForTicket = (ticket: AdminTicketRow): AdminBusinessRow | undefined => {
    const manualId = selectedBizForTicket[ticket.id];
    if (manualId) {
      return businesses.find((b) => b.id === manualId);
    }
    const contactLower = (ticket.sender_contact || '').toLowerCase().trim();
    const byEmail = businesses.find(
      (b) =>
        (b.owner_email && b.owner_email.toLowerCase() === contactLower) ||
        (b.email && b.email.toLowerCase() === contactLower)
    );
    if (byEmail) return byEmail;
    return businesses[0];
  };

  const handleToggleBusinessBan = async (biz: AdminBusinessRow, makeActive: boolean, reason?: string) => {
    setActionBusyId(biz.id);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc('admin_set_business_status', {
        p_business_id: biz.id,
        p_is_active: makeActive,
        p_ban_reason: makeActive ? null : reason || banReasonInput,
      });

      if (error) throw error;

      setBusinesses((prev) =>
        prev.map((item) =>
          item.id === biz.id
            ? {
                ...item,
                is_active: makeActive,
                ban_reason: makeActive ? null : reason || banReasonInput,
              }
            : item
        )
      );
      setBanModalBiz(null);
      showToast(
        makeActive
          ? `✅ "${biz.name}" işletmesinin yasağı kaldırıldı ve tekrar aktif edildi.`
          : `🚫 "${biz.name}" işletmesi askıya alındı ve randevu alımı kapatıldı.`
      );
    } catch (err: any) {
      alert(err?.message || 'İşlem başarısız oldu.');
    } finally {
      setActionBusyId(null);
    }
  };

  const handleChangePlan = async (bizId: string, newPlan: string) => {
    setActionBusyId(bizId);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc('admin_set_business_plan', {
        p_business_id: bizId,
        p_plan: newPlan,
      });

      if (error) throw error;

      setBusinesses((prev) =>
        prev.map((item) =>
          item.id === bizId ? { ...item, subscription_plan: newPlan as any } : item
        )
      );
      showToast(`👑 İşletme paketi "${newPlan.toUpperCase()}" olarak güncellendi.`);
    } catch (err: any) {
      alert(err?.message || 'Paket güncellenemedi.');
    } finally {
      setActionBusyId(null);
    }
  };

  const handleQuickAssistBusiness = async (
    biz: AdminBusinessRow,
    action: 'fix_slug' | 'reset_hours' | 'gift_pro',
    ticketToAutoReply?: AdminTicketRow
  ) => {
    setActionBusyId(biz.id);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('admin_quick_assist_business', {
        p_business_id: biz.id,
        p_action: action,
      });

      if (error) throw error;

      const res = data as any;
      const updatedSlug = res?.slug || biz.slug;

      if (action === 'fix_slug') {
        setBusinesses((prev) =>
          prev.map((item) =>
            item.id === biz.id ? { ...item, slug: updatedSlug, is_active: true, ban_reason: null } : item
          )
        );
      } else if (action === 'gift_pro') {
        setBusinesses((prev) =>
          prev.map((item) =>
            item.id === biz.id ? { ...item, subscription_plan: 'pro', is_active: true } : item
          )
        );
      }

      if (ticketToAutoReply) {
        let autoMsg = '';
        if (action === 'fix_slug') {
          autoMsg = `🔗 İşletmenizin (${biz.name}) randevu bağlantısı destek ekibimiz tarafından onarılmıştır!\n\n👉 Güncel Çalışan Bağlantınız: https://www.randevory.com/${updatedSlug}`;
        } else if (action === 'reset_hours') {
          autoMsg = `🕒 İşletmenizin (${biz.name}) çalışma saatleri destek ekibimiz tarafından Pazartesi-Cumartesi 09:00 - 19:00 olarak açılmıştır. Randevu saatleriniz artık aktif olarak görünmektedir!`;
        } else if (action === 'gift_pro') {
          autoMsg = `🎁 Yaşadığınız aksaklık için özür dileriz! "${biz.name}" işletmenize destek ekibimiz tarafından **Profesyonel Paket** tanımlanmıştır.`;
        }
        await sendAdminMessageToTicket(ticketToAutoReply, autoMsg, 'answered');
      } else {
        showToast(`✅ ${res?.message || 'İşlem tamamlandı!'}`);
      }
    } catch (err: any) {
      alert(err?.message || 'Hızlı yardım işlemi başarısız oldu.');
    } finally {
      setActionBusyId(null);
    }
  };

  const handleGrantLicense = async () => {
    if (!licenseModalBiz) return;
    setActionBusyId(licenseModalBiz.id);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('admin_grant_license', {
        p_business_id: licenseModalBiz.id,
        p_tier: selectedGrantTier,
        p_months: selectedGrantMonths,
      });

      if (error) throw error;
      const res = data as any;

      setBusinesses((prev) =>
        prev.map((b) =>
          b.id === licenseModalBiz.id
            ? {
                ...b,
                subscription_plan: selectedGrantTier,
                subscription_end: res?.period_end,
                is_active: true,
              }
            : b
        )
      );

      if (licenseTicketReply) {
        const tierNames: Record<string, string> = {
          free: 'Ücretsiz Başlangıç',
          standard: 'Standart Paket (149 ₺/ay)',
          pro: 'Profesyonel Paket (299 ₺/ay)',
          enterprise: 'Kurumsal Paket (599 ₺/ay)',
        };
        const dateStr = res?.period_end
          ? new Date(res.period_end).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
          : `${selectedGrantMonths} Ay`;

        const replyMsg = `🎉 Tebrikler! "${licenseModalBiz.name}" işletmenize ${selectedGrantMonths} ay süreyle **${tierNames[selectedGrantTier] || selectedGrantTier}** lisansı başarıyla tanımlanmıştır.\n\n📅 Yeni Paket Bitiş Tarihiniz: ${dateStr}\n\nKampanyamıza katıldığınız için teşekkür eder, RANDEVORY ile bol kazançlar ve randevular dileriz! 🚀`;
        await sendAdminMessageToTicket(licenseTicketReply, replyMsg, 'answered');
      }

      showToast(`👑 ${res?.message || 'Lisans başarıyla tanımlandı!'}`);
      setLicenseModalBiz(null);
      setLicenseTicketReply(null);
    } catch (err: any) {
      alert(err?.message || 'Lisans tanımlanırken bir hata oluştu.');
    } finally {
      setActionBusyId(null);
    }
  };

  const handleAdminImageSelect = (ticketId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          setReplyImages((prev) => ({ ...prev, [ticketId]: canvas.toDataURL('image/jpeg', 0.78) }));
        } else {
          setReplyImages((prev) => ({ ...prev, [ticketId]: ev.target?.result as string }));
        }
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const sendAdminMessageToTicket = async (
    ticket: AdminTicketRow,
    customText?: string,
    targetStatus: 'answered' | 'closed' = 'answered'
  ) => {
    const replyText = (customText ?? replyDrafts[ticket.id] ?? '').trim();
    const replyImg = customText ? null : replyImages[ticket.id] || null;

    if (!replyText && !replyImg && targetStatus === 'answered') {
      alert('Lütfen önce göndermek istediğiniz mesajı yazın veya hızlı araçlardan birine tıklayın.');
      return;
    }

    setActionBusyId(ticket.id);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('support_send_admin_msg', {
        p_ticket_id: ticket.id,
        p_reply: replyText,
        p_status: targetStatus,
        p_image_url: replyImg || '',
      });

      if (error) throw error;

      setTickets((prev) =>
        prev.map((t) => {
          if (t.id !== ticket.id) return t;
          if (data && (data as any).id) {
            return data as AdminTicketRow;
          }
          const nextMsgs = [...(t.messages || [])];
          if (replyText || replyImg) {
            nextMsgs.push({
              sender: 'admin',
              text: replyText || '📷 [Destek Ekibi Fotoğraf Gönderdi]',
              image_url: replyImg,
              created_at: new Date().toISOString(),
            });
          }
          return {
            ...t,
            messages: nextMsgs,
            admin_reply: replyText || t.admin_reply,
            status: targetStatus,
            replied_at: new Date().toISOString(),
          };
        })
      );

      if (!customText) {
        setReplyDrafts((prev) => ({ ...prev, [ticket.id]: '' }));
        setReplyImages((prev) => {
          const copy = { ...prev };
          delete copy[ticket.id];
          return copy;
        });
      }

      showToast('✅ Mesajınız karşı tarafa canlı olarak gönderildi!');
    } catch (err: any) {
      alert(err?.message || 'Mesaj gönderilemedi.');
    } finally {
      setActionBusyId(null);
    }
  };

  // Dedicated Close Ticket handler (never fails!)
  const handleCloseTicket = async (ticket: AdminTicketRow) => {
    setActionBusyId(ticket.id);
    try {
      const supabase = createClient();

      // If admin typed a final note in the box, send it along with closing
      const pendingNote = (replyDrafts[ticket.id] || '').trim();
      if (pendingNote) {
        await supabase.rpc('support_send_admin_msg', {
          p_ticket_id: ticket.id,
          p_reply: pendingNote,
          p_status: 'closed',
          p_image_url: '',
        });
      } else {
        const { error } = await supabase.rpc('support_close_ticket', {
          p_ticket_id: ticket.id,
        });
        if (error) {
          // Direct table update fallback
          await supabase
            .from('platform_support_tickets')
            .update({ status: 'closed', replied_at: new Date().toISOString() })
            .eq('id', ticket.id);
        }
      }

      setTickets((prev) =>
        prev.map((t) => (t.id === ticket.id ? { ...t, status: 'closed' } : t))
      );
      setReplyDrafts((prev) => ({ ...prev, [ticket.id]: '' }));
      showToast('✅ Destek görüşmesi başarıyla kapatıldı.');
    } catch (err: any) {
      alert(err?.message || 'Görüşme kapatılırken hata oluştu.');
    } finally {
      setActionBusyId(null);
    }
  };

  const handleAdminCancelAppointment = async (aptId: string) => {
    setActionBusyId(aptId);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc('admin_cancel_appointment', {
        p_appointment_id: aptId,
        p_reason: 'RANDEVORY Güvenlik ve Destek Ekibi tarafından iptal edildi.',
      });

      if (error) throw error;

      setAppointments((prev) =>
        prev.map((a) => (a.id === aptId ? { ...a, status: 'cancelled' } : a))
      );
      showToast('🚫 Randevu yönetici tarafından iptal edildi.');
    } catch (err: any) {
      alert(err?.message || 'Randevu iptal edilemedi.');
    } finally {
      setActionBusyId(null);
    }
  };

  const handleSavePlatformSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc('admin_update_platform_settings', {
        p_announcement_active: announcementActive,
        p_announcement_text: announcementText.trim(),
        p_support_whatsapp: supportWhatsapp.trim(),
      });

      if (error) throw error;
      showToast('📢 Site geneli duyuru ve destek ayarları güncellendi!');
    } catch (err: any) {
      alert(err?.message || 'Ayarlar kaydedilemedi.');
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        RANDEVORY Kurucu & Güvenlik Kontrol Paneli yükleniyor...
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 rounded-2xl bg-white border border-rose-200 text-center space-y-3 shadow-sm">
        <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto" />
        <h1 className="text-lg font-extrabold text-slate-900">Yetkisiz Erişim</h1>
        <p className="text-xs text-slate-600">
          {errorMsg || 'Bu yönetim paneline yalnızca RANDEVORY Kurucu / Baş Yöneticisi erişebilir.'}
        </p>
      </div>
    );
  }

  const filteredBusinesses = businesses.filter((b) => {
    if (bizFilter === 'active' && !b.is_active) return false;
    if (bizFilter === 'banned' && b.is_active) return false;
    if (!bizSearch.trim()) return true;
    const q = bizSearch.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      b.slug.toLowerCase().includes(q) ||
      (b.city || '').toLowerCase().includes(q) ||
      (b.owner_email || '').toLowerCase().includes(q) ||
      (b.phone || '').toLowerCase().includes(q)
    );
  });

  const filteredTickets = tickets.filter((t) => {
    if (ticketFilter === 'open' && t.status === 'closed') return false;
    if (ticketFilter === 'complaint' && t.category !== 'complaint') return false;
    if (ticketSearch.trim()) {
      const q = ticketSearch.toLowerCase();
      const matchName = (t.sender_name || '').toLowerCase().includes(q);
      const matchContact = (t.sender_contact || '').toLowerCase().includes(q);
      const matchSubject = (t.subject || '').toLowerCase().includes(q);
      const matchSlug = (t.reported_business_slug || '').toLowerCase().includes(q);
      if (!matchName && !matchContact && !matchSubject && !matchSlug) return false;
    }
    return true;
  });

  const activeSelectedTicket =
    filteredTickets.find((t) => t.id === selectedTicketId) ||
    filteredTickets[0] ||
    null;

  const openTicketCount = tickets.filter((t) => t.status === 'open').length;
  const bannedBizCount = businesses.filter((b) => !b.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center shrink-0 shadow-md">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold mb-1">
              Tam Yetkili Kurucu & Canlı Destek Modu Aktif
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              RANDEVORY Merkez Yönetim & Destek Paneli
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Tek tıkla işletme bağlantısı çekip gönderin, şifre sıfırlama linki atın, çalışma saatlerini onarın veya şüpheli işletmeleri yasaklayın.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadAdminOverview}
          className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 self-start sm:self-auto transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Verileri Yenile
        </button>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between shadow-sm">
          <span>{feedback}</span>
          <button type="button" onClick={() => setFeedback(null)} className="text-emerald-700 hover:underline">
            Kapat
          </button>
        </div>
      )}

      {/* Top KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-500">Kayıtlı İşletmeler</span>
            <Building2 className="w-5 h-5 text-brand-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{businesses.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span className="text-emerald-600 font-bold">{businesses.length - bannedBizCount} Aktif</span> •{' '}
            <span className="text-rose-600 font-bold">{bannedBizCount} Yasaklı</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-500">Bekleyen Destek / İhbar</span>
            <Headset className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{openTicketCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Toplam {tickets.length} destek görüşmesi
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-500">Kayıtlı Kullanıcılar</span>
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalUsers}</div>
          <div className="text-[11px] text-slate-500 mt-1">Platform üyeleri & yöneticiler</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-500">Son Randevu Trafiği</span>
            <Calendar className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{appointments.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Denetlenebilir son randevular</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('tickets')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'tickets'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Headset className="w-4 h-4" />
          Canlı Destek & Şikayet Sohbetleri ({tickets.length})
          {openTicketCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px]">
              {openTicketCount} Bekleyen
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('businesses')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'businesses'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Building2 className="w-4 h-4" />
          İşletmeler, Bağlantı Çek & Yasakla ({businesses.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('appointments')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'appointments'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Tüm Randevuları Denetle ({appointments.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'settings'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          Site Duyuru Bandı & Ayarlar
        </button>
      </div>

      {/* TAB 1: SUPPORT TICKETS (MODERN MASTER-DETAIL INBOX) */}
      {activeTab === 'tickets' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 h-[580px] sm:h-[640px]">
          {/* Sol Kolon: Bilet Listesi & Arama (lg:col-span-4) */}
          <div
            className={`${
              activeSelectedTicket && selectedTicketId ? 'hidden lg:flex' : 'flex'
            } lg:col-span-4 lg:border-r border-slate-200 flex-col h-full min-h-0 bg-slate-50/50`}
          >
            {/* Filtre Butonları & Arama Kutusu */}
            <div className="p-3 border-b border-slate-200 space-y-2 bg-white shrink-0">
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setTicketFilter('all')}
                  className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center ${
                    ticketFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tümü ({tickets.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTicketFilter('open')}
                  className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center ${
                    ticketFilter === 'open'
                      ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Açık ({tickets.filter((t) => t.status !== 'closed').length})
                </button>
                <button
                  type="button"
                  onClick={() => setTicketFilter('complaint')}
                  className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center ${
                    ticketFilter === 'complaint'
                      ? 'bg-rose-600 text-white shadow-2xs font-extrabold'
                      : 'text-rose-700 hover:text-rose-900'
                  }`}
                >
                  🚨 Şikayet ({tickets.filter((t) => t.category === 'complaint').length})
                </button>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="İsim, telefon veya konu ara..."
                  value={ticketSearch}
                  onChange={(e) => setTicketSearch(e.target.value)}
                  className="w-full pl-8 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                />
                {ticketSearch && (
                  <button
                    type="button"
                    onClick={() => setTicketSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    title="Temizle"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Bilet Listesi */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 min-h-0">
              {filteredTickets.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Aramanızla eşleşen destek görüşmesi bulunamadı.
                </div>
              ) : (
                filteredTickets.map((ticket) => {
                  const isSelected = activeSelectedTicket?.id === ticket.id;
                  const isComplaint = ticket.category === 'complaint';
                  const isWaiting = ticket.status === 'open';

                  return (
                    <button
                      key={ticket.id}
                      type="button"
                      onClick={() => setSelectedTicketId(ticket.id)}
                      className={`w-full p-3.5 text-left transition-all flex items-start gap-3 hover:bg-slate-100/70 ${
                        isSelected
                          ? 'bg-brand-50/70 border-l-4 border-l-brand-600 shadow-2xs'
                          : isComplaint
                          ? 'bg-rose-50/30'
                          : 'bg-white'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-2xs ${
                            isComplaint
                              ? 'bg-rose-100 text-rose-700'
                              : isWaiting
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-900 text-white'
                          }`}
                        >
                          {isComplaint ? '🚨' : ticket.sender_name.charAt(0).toUpperCase()}
                        </div>
                        {isWaiting && (
                          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-white animate-pulse" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`text-xs truncate ${
                              isWaiting ? 'font-black text-slate-900' : 'font-bold text-slate-800'
                            }`}
                          >
                            {ticket.sender_name}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                            {new Date(ticket.created_at).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-slate-900 truncate mt-0.5">
                          {ticket.subject}
                        </p>

                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {ticket.message}
                        </p>

                        <div className="flex items-center gap-1.5 mt-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isComplaint
                                ? 'bg-rose-100 text-rose-800'
                                : ticket.category === 'billing'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {isComplaint
                              ? 'Şikayet'
                              : ticket.category === 'billing'
                              ? 'Paket'
                              : 'Destek'}
                          </span>

                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              ticket.status === 'answered'
                                ? 'bg-emerald-50 text-emerald-700'
                                : ticket.status === 'closed'
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {ticket.status === 'answered'
                              ? '✓ Yanıtlandı'
                              : ticket.status === 'closed'
                              ? 'Kapalı'
                              : '⏳ Bekliyor'}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Sağ Kolon: Seçili Bilet Detayı & Canlı Sohbet (lg:col-span-8) */}
          <div
            className={`${
              !activeSelectedTicket || !selectedTicketId ? 'hidden lg:flex' : 'flex'
            } lg:col-span-8 flex-col h-full min-h-0 bg-white`}
          >
            {!activeSelectedTicket ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <Headset className="w-12 h-12 text-slate-300 mb-3" />
                <h3 className="font-bold text-sm text-slate-700">Destek Görüşmesi Seçilmedi</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Görüşmeyi görüntülemek, yanıtlamak veya işlem yapmak için soldaki listeden bir destek talebi seçin.
                </p>
              </div>
            ) : (() => {
                const ticket = activeSelectedTicket;
                const matchedBiz = getMatchedBusinessForTicket(ticket);
                const isComplaint = ticket.category === 'complaint';

                return (
                  <div className="flex-1 flex flex-col h-full min-h-0">
                    {/* Sohbet Başlığı (Header) */}
                    <div className="p-3 lg:px-4 lg:py-3 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-2 shrink-0">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Mobil Geri Dön Butonu */}
                        <button
                          type="button"
                          onClick={() => setSelectedTicketId(null)}
                          className="lg:hidden p-1.5 -ml-1 rounded-xl text-slate-600 hover:bg-slate-100 shrink-0"
                          title="Listeye Dön"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>

                        <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                          {ticket.sender_name.charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h2 className="font-extrabold text-sm text-slate-900 truncate">
                              {ticket.sender_name}
                            </h2>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isComplaint
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {ticket.subject}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 truncate">
                            <span className="font-medium text-slate-600">{ticket.sender_contact}</span>
                            <span>•</span>
                            <span>{new Date(ticket.created_at).toLocaleString('tr-TR')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Hızlı Araçlar Toggle */}
                        <button
                          type="button"
                          onClick={() => setShowQuickTools((prev) => !prev)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                            showQuickTools
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                          }`}
                          title="Hızlı İşlemler & Linkler"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Hızlı Araçlar</span>
                        </button>

                        {/* WhatsApp Butonu */}
                        {/\d{10,}/.test(ticket.sender_contact.replace(/\D/g, '')) && (
                          <a
                            href={buildWhatsAppUrl(
                              ticket.sender_contact,
                              `Merhaba ${ticket.sender_name}, RANDEVORY Destek Ekibi'nden ulaşıyoruz. "${ticket.subject}" konulu destek talebiniz hakkında:`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </a>
                        )}

                        {/* Kapat / Çözüldü Butonu */}
                        {ticket.status !== 'closed' ? (
                          <button
                            type="button"
                            disabled={actionBusyId === ticket.id}
                            onClick={() => handleCloseTicket(ticket)}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
                          >
                            ✓ Kapat
                          </button>
                        ) : (
                          <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold">
                            🔒 Kapalı
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Şikayet Bildirimi (varsa) */}
                    {ticket.reported_business_slug && (
                      <div className="px-4 py-2 bg-rose-50 border-b border-rose-200 flex items-center justify-between gap-3 text-xs text-rose-900 shrink-0">
                        <div className="flex items-center gap-2 truncate">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span className="truncate">
                            Şikayet Edilen İşletme: <strong>{ticket.reported_business_slug}</strong>
                          </span>
                        </div>
                        <a
                          href={`/${ticket.reported_business_slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-0.5 rounded-lg bg-rose-600 text-white font-bold text-[11px] hover:bg-rose-700 shrink-0"
                        >
                          İşletmeyi Aç &rarr;
                        </a>
                      </div>
                    )}

                    {/* Canlı Mesajlaşma Akışı */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#f8fafc] min-h-0">
                      {(Array.isArray(ticket.messages) && ticket.messages.length > 0
                        ? ticket.messages
                        : [
                            {
                              sender: 'user' as const,
                              text: ticket.message,
                              image_url: null,
                              created_at: ticket.created_at,
                            },
                            ...(ticket.admin_reply
                              ? [
                                  {
                                    sender: 'admin' as const,
                                    text: ticket.admin_reply,
                                    image_url: null,
                                    created_at: ticket.replied_at || ticket.created_at,
                                  },
                                ]
                              : []),
                          ]
                      ).map((msg, mIdx) => {
                        const isAdmin = msg.sender === 'admin';
                        const isAi = msg.sender === 'ai';

                        return (
                          <div
                            key={mIdx}
                            className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                          >
                            <div
                              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-2xs ${
                                isAdmin
                                  ? 'bg-brand-600 text-white rounded-tr-xs'
                                  : isAi
                                  ? 'bg-indigo-50/90 border border-indigo-200 text-indigo-950 rounded-tl-xs'
                                  : 'bg-white border border-slate-200 text-slate-900 rounded-tl-xs'
                              }`}
                            >
                              <div
                                className={`text-[10px] font-bold mb-1 flex items-center gap-1 ${
                                  isAdmin
                                    ? 'text-brand-100'
                                    : isAi
                                    ? 'text-indigo-600'
                                    : 'text-slate-500'
                                }`}
                              >
                                {isAdmin
                                  ? '🛡️ Siz (Yönetici)'
                                  : isAi
                                  ? '🤖 Yapay Zeka Asistanı'
                                  : `👤 ${ticket.sender_name}`}
                              </div>

                              {msg.image_url && (
                                <div className="my-2">
                                  <img
                                    src={msg.image_url}
                                    alt="Ekran Görüntüsü"
                                    onClick={() => setLightboxImage(msg.image_url || null)}
                                    className="rounded-xl max-h-52 w-auto object-cover border border-black/10 cursor-zoom-in hover:opacity-95"
                                  />
                                </div>
                              )}

                              <p className="whitespace-pre-wrap">{msg.text}</p>

                              <div
                                className={`text-[10px] mt-1 text-right font-medium ${
                                  isAdmin ? 'text-brand-200' : 'text-slate-400'
                                }`}
                              >
                                {new Date(msg.created_at).toLocaleTimeString('tr-TR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Hızlı İşlem Araçları & Link Gönderme Menüsü (Açılır/Kapanır) */}
                    {showQuickTools && (
                      <div className="p-3 bg-indigo-50/90 border-t border-indigo-200 space-y-2 shrink-0 max-h-48 overflow-y-auto">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] font-extrabold text-indigo-950 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                            İşletme Seçimi & Hızlı Eylemler:
                          </span>

                          <select
                            value={matchedBiz?.id || ''}
                            onChange={(e) =>
                              setSelectedBizForTicket((prev) => ({
                                ...prev,
                                [ticket.id]: e.target.value,
                              }))
                            }
                            className="px-2 py-1 rounded-lg border border-indigo-300 bg-white font-bold text-slate-800 text-xs"
                          >
                            {businesses.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.name} (/{b.slug})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {matchedBiz && (
                            <button
                              type="button"
                              disabled={actionBusyId === ticket.id}
                              onClick={() =>
                                sendAdminMessageToTicket(
                                  ticket,
                                  `🔗 İşletmenizin (${matchedBiz.name}) güncel ve aktif randevu bağlantısı:\n👉 https://www.randevory.com/${matchedBiz.slug}\n\nMüşterileriniz bu bağlantıya tıklayarak 7/24 randevu alabilir.`
                                )
                              }
                              className="px-2.5 py-1 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition-colors"
                            >
                              <Link2 className="w-3 h-3" />
                              Link Gönder (/{matchedBiz.slug})
                            </button>
                          )}

                          {matchedBiz && (
                            <button
                              type="button"
                              disabled={actionBusyId === matchedBiz.id}
                              onClick={() => handleQuickAssistBusiness(matchedBiz, 'fix_slug', ticket)}
                              className="px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-300 font-bold text-[11px] flex items-center gap-1 transition-colors"
                            >
                              <Wrench className="w-3 h-3 text-indigo-600" />
                              Linki Onar
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={actionBusyId === ticket.id}
                            onClick={() =>
                              sendAdminMessageToTicket(
                                ticket,
                                `🔑 Şifrenizi yenilemek için aşağıdaki resmi şifre sıfırlama bağlantımıza tıklayın:\n👉 https://www.randevory.com/forgot-password\n\nKayıtlı e-posta adresinizi (${ticket.sender_contact}) yazarak yeni şifrenizi hemen belirleyebilirsiniz.`
                              )
                            }
                            className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 font-bold text-[11px] flex items-center gap-1 transition-colors"
                          >
                            <KeyRound className="w-3 h-3 text-amber-600" />
                            Şifre Sıfırlama Linki
                          </button>

                          {matchedBiz && (
                            <button
                              type="button"
                              disabled={actionBusyId === matchedBiz.id}
                              onClick={() => handleQuickAssistBusiness(matchedBiz, 'reset_hours', ticket)}
                              className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold text-[11px] flex items-center gap-1 transition-colors"
                            >
                              <Clock className="w-3 h-3 text-emerald-600" />
                              Saatleri Aç (09-19)
                            </button>
                          )}

                          {matchedBiz && (
                            <button
                              type="button"
                              onClick={() => {
                                setLicenseModalBiz(matchedBiz);
                                setLicenseTicketReply(ticket);
                                setSelectedGrantTier(matchedBiz.subscription_plan === 'free' ? 'standard' : matchedBiz.subscription_plan);
                                setSelectedGrantMonths(1);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition-all"
                              title="İşletmeye 1 ay / istenen sürede Standart, Pro veya Kurumsal lisans tanımla"
                            >
                              <Crown className="w-3 h-3 text-amber-200" />
                              👑 Aylık Lisans Tanımla (+1 Ay Standart / Pro)
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Mesaj Gönderme Çubuğu (HER ZAMAN SABİT VE GÖRÜNÜR) */}
                    <div className="p-2.5 sm:p-3 bg-white border-t border-slate-200 shrink-0 space-y-2">
                      {replyImages[ticket.id] && (
                        <div className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img
                              src={replyImages[ticket.id]}
                              alt="Önizleme"
                              className="w-8 h-8 rounded-lg object-cover border border-slate-300"
                            />
                            <span className="text-xs font-semibold text-slate-700">Fotoğraf seçildi</span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setReplyImages((prev) => {
                                const copy = { ...prev };
                                delete copy[ticket.id];
                                return copy;
                              })
                            }
                            className="text-xs font-bold text-rose-600 hover:underline px-2"
                          >
                            Kaldır
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        {/* Fotoğraf Ekle Butonu */}
                        <label
                          title="Fotoğraf / Ekran Görüntüsü Ekle"
                          className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 cursor-pointer flex items-center justify-center shrink-0 transition-colors"
                        >
                          <ImagePlus className="w-4 h-4 text-brand-600" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleAdminImageSelect(ticket.id, e)}
                            className="hidden"
                          />
                        </label>

                        {/* Mesaj Input */}
                        <input
                          type="text"
                          placeholder="Mesajınızı yazın... (Enter ile gönder)"
                          value={replyDrafts[ticket.id] ?? ''}
                          onChange={(e) =>
                            setReplyDrafts((prev) => ({ ...prev, [ticket.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              sendAdminMessageToTicket(ticket);
                            }
                          }}
                          className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                        />

                        {/* Gönder Butonu */}
                        <button
                          type="button"
                          disabled={actionBusyId === ticket.id}
                          onClick={() => sendAdminMessageToTicket(ticket)}
                          className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-2xs transition-all"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Gönder</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
          </div>
        </div>
      )}

      {/* TAB 2: BUSINESSES MODERATION, LINK PULLING & BANNING */}
      {activeTab === 'businesses' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="İşletme adı, link, şehir, telefon veya e-posta ara..."
                value={bizSearch}
                onChange={(e) => setBizSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              {[
                { key: 'all', label: `Tümü (${businesses.length})` },
                { key: 'active', label: `Aktif (${businesses.length - bannedBizCount})` },
                { key: 'banned', label: `Yasaklı (${bannedBizCount})` },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setBizFilter(f.key as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    bizFilter === f.key
                      ? 'bg-brand-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-200">
            {filteredBusinesses.map((biz) => {
              const fullBizUrl = `https://www.randevory.com/${biz.slug}`;
              return (
                <div
                  key={biz.id}
                  className={`p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    !biz.is_active ? 'bg-rose-50/40' : 'hover:bg-slate-50/60'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900">{biz.name}</span>
                      <Link
                        href={`/${biz.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-mono"
                      >
                        /{biz.slug} <ExternalLink className="w-3 h-3" />
                      </Link>
                      {biz.is_active ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          ✓ Aktif İşletme
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                          🚫 Yasaklı / Askıda
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>
                        📍 {biz.city} {biz.district ? `/ ${biz.district}` : ''}
                      </span>
                      <span>📞 {biz.phone}</span>
                      {biz.owner_email && (
                        <span>
                          👤 Kurucu: <strong>{biz.owner_email}</strong>
                        </span>
                      )}
                      <span>👥 {biz.staff_count} Personel</span>
                      <span>📅 {biz.appointment_count} Randevu</span>
                    </div>

                    {!biz.is_active && biz.ban_reason && (
                      <div className="text-xs text-rose-700 bg-rose-100/80 border border-rose-200 rounded-lg px-3 py-1.5 font-medium">
                        <strong>Yasaklanma Nedeni:</strong> {biz.ban_reason}
                      </div>
                    )}
                  </div>

                  {/* Admin Controls for this Business */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {/* Pull / Copy Link Button */}
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(fullBizUrl);
                        showToast(`🔗 "${biz.name}" bağlantısı kopyalandı: ${fullBizUrl}`);
                      }}
                      className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5 text-indigo-600" />
                      Bağlantı Çek
                    </button>

                    {/* Repair Link Button */}
                    <button
                      type="button"
                      disabled={actionBusyId === biz.id}
                      onClick={() => handleQuickAssistBusiness(biz, 'fix_slug')}
                      title="Bozuk işletme linkini otomatik onar"
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Wrench className="w-3.5 h-3.5 text-slate-600" />
                      Linki Onar
                    </button>

                    {/* Active Plan Badge & Grant Button */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200">
                        <Crown className={`w-3.5 h-3.5 ${biz.subscription_plan !== 'free' ? 'text-amber-500' : 'text-slate-400'}`} />
                        <span className="text-xs font-bold text-slate-800 capitalize">
                          {biz.subscription_plan === 'free' ? 'Ücretsiz' : biz.subscription_plan === 'standard' ? 'Standart' : biz.subscription_plan === 'pro' ? 'Profesyonel' : 'Kurumsal'}
                        </span>
                        {biz.subscription_end && (
                          <span className="text-[10px] text-slate-500 font-medium">
                            ({new Date(biz.subscription_end).toLocaleDateString('tr-TR')})
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setLicenseModalBiz(biz);
                          setLicenseTicketReply(null);
                          setSelectedGrantTier(biz.subscription_plan === 'free' ? 'standard' : biz.subscription_plan);
                          setSelectedGrantMonths(1);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all"
                        title="İşletmeye 1 ay veya istenen sürede paket lisansı ekle/uzat"
                      >
                        <Crown className="w-3.5 h-3.5 text-amber-200" />
                        Lisans Ekle / Uzat
                      </button>
                    </div>

                    {/* Ban / Unban Button */}
                    {biz.is_active ? (
                      <button
                        type="button"
                        disabled={actionBusyId === biz.id}
                        onClick={() => {
                          setBanModalBiz(biz);
                          setBanReasonInput(
                            'Güvenilir olmayan içerik veya kullanım koşulları ihlali nedeniyle RANDEVORY Destek Ekibi tarafından askıya alınmıştır.'
                          );
                        }}
                        className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        Yasakla
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={actionBusyId === biz.id}
                        onClick={() => handleToggleBusinessBan(biz, true)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Yasağı Kaldır
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: APPOINTMENTS MODERATION */}
      {activeTab === 'appointments' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50">
            <h3 className="font-bold text-sm text-slate-900">
              Platform Genelindeki Son 60 Randevu
            </h3>
            <p className="text-xs text-slate-500">
              Sahte veya spam olduğunu tespit ettiğiniz randevuları buradan doğrudan iptal edebilirsiniz.
            </p>
          </div>

          <div className="divide-y divide-slate-200">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900">{apt.customer_name}</span>
                    <span className="text-slate-500">({apt.customer_phone})</span>
                    <span className="text-slate-300">•</span>
                    <span className="font-semibold text-brand-700">
                      {apt.business_name || 'İşletme'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        apt.status === 'cancelled'
                          ? 'bg-rose-100 text-rose-700'
                          : apt.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {apt.status}
                    </span>
                  </div>
                  <div className="text-slate-500">
                    Hizmet: <strong>{apt.service_name || '-'}</strong> • Tarih:{' '}
                    {new Date(apt.start_time).toLocaleString('tr-TR')} • Tutar:{' '}
                    <strong>{apt.total_price} ₺</strong>
                  </div>
                </div>

                {apt.status !== 'cancelled' && (
                  <button
                    type="button"
                    disabled={actionBusyId === apt.id}
                    onClick={() => handleAdminCancelAppointment(apt.id)}
                    className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold flex items-center gap-1 self-start sm:self-auto"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Randevuyu İptal Et
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: GLOBAL SITE ANNOUNCEMENT & SUPPORT SETTINGS */}
      {activeTab === 'settings' && (
        <form
          onSubmit={handleSavePlatformSettings}
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5 max-w-2xl"
        >
          <div>
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-brand-600" />
              Site Geneli Canlı Duyuru Bandı & Destek Ayarları
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Buradan tüm sitede en üstte görünecek bir duyuru/kampanya mesajı yayınlayabilirsiniz.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <div className="font-bold text-xs text-slate-900">
                Üst Duyuru Bandını Aktif Et
              </div>
              <div className="text-[11px] text-slate-500">
                Açıldığında ana sayfa dahil tüm sayfalarda en üstte şık bir duyuru şeridi görünür.
              </div>
            </div>
            <input
              type="checkbox"
              checked={announcementActive}
              onChange={(e) => setAnnouncementActive(e.target.checked)}
              className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500"
            />
          </div>

          {/* Hazır Şekilli Şablonlar & Kısayollar */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Şekilli Hazır Duyuru Şablonları (Tek Tıkla Doldur):
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Tıkla, kutu otomatik dolsun</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                {
                  badge: '🔥 %30 İNDİRİM',
                  title: 'RANDEVORY30 Kupon Kodu',
                  text: '🔥 LANSMANA ÖZEL TÜM PAKETLERDE %30 İNDİRİM! KOD: RANDEVORY30 🏷️ | İlk Lisans Alımınızda +1 Ay Ekstra Hediye! Detaylar İçin Canlı Destekle İletişime Geçin 🚀',
                  color: 'hover:border-rose-300 hover:bg-rose-50/40',
                },
                {
                  badge: '🎁 1 ALANA 1 BEDAVA',
                  title: 'Ekstra +1 Ay Lisans Kampanyası',
                  text: '🎉 BÜYÜK FIRSAT! Satın Aldığınız İlk Lisans Süresi Kadar Ekstra +1 Ay ÜCRETSİZ Hediye! Detaylar ve Aktivasyon İçin Canlı Destekle İletişime Geçin 💬',
                  color: 'hover:border-purple-300 hover:bg-purple-50/40',
                },
                {
                  badge: '☕ YENİ SEKTÖR',
                  title: 'Kafe & Masa Rezervasyon Lansmanı',
                  text: '☕ MÜJDE! Kafe, Restoran ve Masa Rezervasyon Modülü Yayında! İlk 50 İşletmeye Özel %30 İndirim Kodu: RANDEVORY30 🍽️',
                  color: 'hover:border-amber-300 hover:bg-amber-50/40',
                },
                {
                  badge: '⚡ PRO DENEYİMİ',
                  title: 'Genel Tanıtım & Randevu Fırsatı',
                  text: '⚡ RANDEVORY PRO DENEYİMİ BAŞLADI! Kuaför, Kafe, Oto Bakım ve Tüm İşletmelere Özel İlk Ay Süper Avantajlı Lisans Fırsatını Kaçırmayın 👑',
                  color: 'hover:border-blue-300 hover:bg-blue-50/40',
                },
              ].map((template, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setAnnouncementText(template.text);
                    setAnnouncementActive(true);
                  }}
                  className={`p-2.5 rounded-xl border border-slate-200 bg-white text-left transition-all ${template.color} shadow-2xs group`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-[11px] text-slate-900 group-hover:text-brand-600 transition-colors">
                      {template.title}
                    </span>
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {template.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-1">
                    {template.text}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Duyuru Metni Giriş Alanı & Emoji Çubuğu */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                Duyuru Metni
              </label>

              {/* Hızlı Emoji & Sembol Ekleme */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400 font-semibold mr-1">Hızlı Emoji:</span>
                {['🔥', '🏷️', '🎉', '👑', '🚀', '⚡', '🎁', '☕', '💎', '💬', '👉'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setAnnouncementText((prev) => `${prev} ${emoji}`.trim())}
                    className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-xs flex items-center justify-center transition-colors"
                    title={`Metne ${emoji} ekle`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={2}
              placeholder="Örn: 🎉 RANDEVORY Lansmanına Özel %30 İndirim Kodu: RANDEVORY30..."
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
            />
          </div>

          {/* Canlı Önizleme (Marquee Ticker Preview) */}
          {announcementText && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-slate-400" /> Sitede Nasıl Görünecek? (Canlı Önizleme):
              </span>
              <div className="rounded-xl overflow-hidden bg-gradient-to-r from-slate-950 via-brand-900 to-indigo-950 text-white p-2.5 text-xs font-semibold shadow-xs flex items-center gap-3">
                <div className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] tracking-wide shrink-0">
                  🔥 FIRSAT
                </div>
                <div className="overflow-hidden flex-1">
                  <div className="animate-marquee inline-flex items-center gap-12 text-[11px] text-white/95">
                    <span>{announcementText}</span>
                    <span>{announcementText}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={savingSettings}
            className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-all"
          >
            {savingSettings ? 'Kaydediliyor...' : 'Ayarları Kaydet ve Yayınla'}
          </button>
        </form>
      )}

      {/* LIGHTBOX FOR SUPPORT SCREENSHOTS */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[85vh]">
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 px-3 py-1 rounded-lg bg-white/20 text-white text-xs font-bold hover:bg-white/30"
            >
              Kapat (X)
            </button>
            <img
              src={lightboxImage}
              alt="Büyütülmüş Ekran Görüntüsü"
              className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl border border-white/20 object-contain"
            />
          </div>
        </div>
      )}

      {/* BAN CONFIRMATION MODAL */}
      {banModalBiz && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <Ban className="w-6 h-6 shrink-0" />
              <h3 className="font-extrabold text-base text-slate-900">
                İşletmeyi Yasakla / Askıya Al
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>{banModalBiz.name}</strong> (<code>/{banModalBiz.slug}</code>) işletmesini askıya almak üzeresiniz. Yasaklanan işletmelerin sayfasına girildiğinde güvenlik uyarısı gösterilir ve yeni randevu alınamaz.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Yasaklama / Askıya Alma Gerekçesi:
              </label>
              <textarea
                rows={3}
                value={banReasonInput}
                onChange={(e) => setBanReasonInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBanModalBiz(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={actionBusyId === banModalBiz.id}
                onClick={() => handleToggleBusinessBan(banModalBiz, false, banReasonInput)}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
              >
                İşletmeyi Şimdi Yasakla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LICENSE GRANT / EXTENSION MODAL */}
      {licenseModalBiz && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
                  <Crown className="w-5 h-5 text-amber-200" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Aylık Lisans & Paket Tanımla
                  </h3>
                  <p className="text-xs text-slate-500">
                    İşletmeye hediye veya satın alım bonusu olarak lisans tanımlayın
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLicenseModalBiz(null);
                  setLicenseTicketReply(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Hedef İşletme Bilgisi */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900 block">{licenseModalBiz.name}</span>
                <span className="text-slate-500">/{licenseModalBiz.slug} • {licenseModalBiz.owner_email || licenseModalBiz.phone}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">Mevcut Durum:</span>
                <span className="font-extrabold text-brand-600 capitalize">
                  {licenseModalBiz.subscription_plan} {licenseModalBiz.subscription_end ? `(${new Date(licenseModalBiz.subscription_end).toLocaleDateString('tr-TR')})` : ''}
                </span>
              </div>
            </div>

            {/* Paket Seçimi */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                1. Tanımlanacak Paket Türünü Seçin:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    tier: 'standard' as const,
                    name: 'Standart Paket',
                    price: '149 ₺/ay',
                    desc: '3 Personel, 20 Hizmet, 300 Randevu, SMS',
                    border: 'border-blue-300',
                    badge: 'bg-blue-100 text-blue-800',
                  },
                  {
                    tier: 'pro' as const,
                    name: 'Profesyonel',
                    price: '299 ₺/ay',
                    desc: '10 Personel, 100 Hizmet, 1500 Randevu, Raporlar',
                    border: 'border-purple-300',
                    badge: 'bg-purple-100 text-purple-800',
                  },
                  {
                    tier: 'enterprise' as const,
                    name: 'Kurumsal',
                    price: '599 ₺/ay',
                    desc: 'Sınırsız Personel & Hizmet, VIP API, Destek',
                    border: 'border-amber-300',
                    badge: 'bg-amber-100 text-amber-800',
                  },
                  {
                    tier: 'free' as const,
                    name: 'Ücretsiz Başlangıç',
                    price: '0 ₺',
                    desc: 'Temel plan (1 Personel, 5 Hizmet)',
                    border: 'border-slate-300',
                    badge: 'bg-slate-100 text-slate-700',
                  },
                ].map((plan) => {
                  const isSelected = selectedGrantTier === plan.tier;
                  return (
                    <button
                      key={plan.tier}
                      type="button"
                      onClick={() => setSelectedGrantTier(plan.tier)}
                      className={`p-3 rounded-xl border text-left transition-all relative ${
                        isSelected
                          ? 'border-brand-600 bg-brand-50/60 ring-2 ring-brand-500 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-extrabold text-xs text-slate-900">{plan.name}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${plan.badge}`}>
                          {plan.price}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight">{plan.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Süre Seçimi */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                2. Eklenecek / Tanımlanacak Süreyi Seçin:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { months: 1, label: '1 Ay', bonus: 'Standart/Hediye' },
                  { months: 3, label: '3 Ay', bonus: 'Çeyrek Yıl' },
                  { months: 6, label: '6 Ay', bonus: 'Yarım Yıl' },
                  { months: 12, label: '12 Ay', bonus: '1 Tam Yıl' },
                ].map((dur) => {
                  const isSelected = selectedGrantMonths === dur.months;
                  return (
                    <button
                      key={dur.months}
                      type="button"
                      onClick={() => setSelectedGrantMonths(dur.months)}
                      className={`py-2 px-2 rounded-xl border text-center transition-all ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs font-black'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 font-bold'
                      }`}
                    >
                      <div className="text-xs">{dur.label}</div>
                      <div className={`text-[9px] ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                        {dur.bonus}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bilgilendirme Notu */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
              💡 <strong>Nasıl Çalışır?</strong> Eğer işletmenin mevcut aktif bir lisansı varsa, seçtiğiniz <strong>{selectedGrantMonths} ay</strong> mevcut sürenin sonuna eklenir (uzatılır). Lisansı yoksa bugünden itibaren başlatılır.
              {licenseTicketReply && (
                <div className="mt-1 font-semibold text-indigo-900">
                  📩 İşlem tamamlandığında karşı tarafa canlı destek üzerinden tebrik ve onay mesajı otomatik iletilecektir.
                </div>
              )}
            </div>

            {/* Aksiyon Butonları */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setLicenseModalBiz(null);
                  setLicenseTicketReply(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
              >
                Vazgeç
              </button>

              <button
                type="button"
                disabled={actionBusyId === licenseModalBiz.id}
                onClick={handleGrantLicense}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
              >
                <Crown className="w-4 h-4 text-amber-200" />
                {actionBusyId === licenseModalBiz.id ? 'Tanımlanıyor...' : `${selectedGrantMonths} Ay Lisansı Tanımla ve Aktif Et`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
