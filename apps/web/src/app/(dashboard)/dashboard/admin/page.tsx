'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  messages?: Array<{ sender: 'user' | 'admin'; text: string; created_at: string }>;
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

  const [activeTab, setActiveTab] = useState<'businesses' | 'tickets' | 'appointments' | 'settings'>('businesses');

  // Data state
  const [totalUsers, setTotalUsers] = useState(0);
  const [businesses, setBusinesses] = useState<AdminBusinessRow[]>([]);
  const [tickets, setTickets] = useState<AdminTicketRow[]>([]);
  const [appointments, setAppointments] = useState<AdminAppointmentRow[]>([]);

  // Filters
  const [bizSearch, setBizSearch] = useState('');
  const [bizFilter, setBizFilter] = useState<'all' | 'active' | 'banned'>('all');
  const [ticketFilter, setTicketFilter] = useState<'all' | 'open' | 'complaint'>('all');

  // Ticket reply state
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  // Ban modal state
  const [banModalBiz, setBanModalBiz] = useState<AdminBusinessRow | null>(null);
  const [banReasonInput, setBanReasonInput] = useState(
    'Güvenilir olmayan içerik veya kullanım koşulları ihlali nedeniyle RANDEVORY Destek Ekibi tarafından askıya alınmıştır.'
  );

  // Global Platform Settings
  const [announcementActive, setAnnouncementActive] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');
  const [supportWhatsapp, setSupportWhatsapp] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4000);
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

  const handleReplyTicket = async (ticket: AdminTicketRow, newStatus: 'answered' | 'closed') => {
    const replyText = (replyDrafts[ticket.id] ?? '').trim();
    if (!replyText && newStatus === 'answered') {
      alert('Lütfen önce göndermek istediğiniz mesajı yazın.');
      return;
    }

    setActionBusyId(ticket.id);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('admin_reply_support_ticket', {
        p_ticket_id: ticket.id,
        p_reply: replyText,
        p_status: newStatus,
      });

      if (error) throw error;

      setTickets((prev) =>
        prev.map((t) => {
          if (t.id !== ticket.id) return t;
          if (data && (data as any).id) {
            return data as AdminTicketRow;
          }
          const nextMsgs = [...(t.messages || [])];
          if (replyText) {
            nextMsgs.push({
              sender: 'admin',
              text: replyText,
              created_at: new Date().toISOString(),
            });
          }
          return {
            ...t,
            messages: nextMsgs,
            admin_reply: replyText || t.admin_reply,
            status: newStatus,
            replied_at: new Date().toISOString(),
          };
        })
      );
      setReplyDrafts((prev) => ({ ...prev, [ticket.id]: '' }));
      showToast(
        newStatus === 'closed'
          ? '✅ Görüşme çözüldü olarak kapatıldı.'
          : '✅ Mesajınız karşı tarafa canlı olarak iletildi!'
      );
    } catch (err: any) {
      alert(err?.message || 'Yanıt kaydedilemedi.');
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
    if (ticketFilter === 'open' && t.status !== 'open') return false;
    if (ticketFilter === 'complaint' && t.category !== 'complaint') return false;
    return true;
  });

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
              Tam Yetkili Kurucu & Güvenlik Modu Aktif
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              RANDEVORY Merkez Yönetim & Destek Paneli
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Sitedeki tüm işletmeleri denetleyin, güvenilir olmayan yerleri tek tıkla yasaklayın, paket tanımlayın ve destek taleplerini yanıtlayın.
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
            Toplam {tickets.length} destek ve şikayet kaydı
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
          onClick={() => setActiveTab('businesses')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'businesses'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Building2 className="w-4 h-4" />
          İşletme Denetimi & Yasaklama ({businesses.length})
        </button>

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
          Destek & Şikayet Talepleri ({tickets.length})
          {openTicketCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px]">
              {openTicketCount} Yeni
            </span>
          )}
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
          Site Duyuru Bandı & Destek Ayarları
        </button>
      </div>

      {/* TAB 1: BUSINESSES MODERATION & BANNING */}
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
            {filteredBusinesses.map((biz) => (
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
                    <span>📍 {biz.city} {biz.district ? `/ ${biz.district}` : ''}</span>
                    <span>📞 {biz.phone}</span>
                    {biz.owner_email && <span>👤 Kurucu: <strong>{biz.owner_email}</strong></span>}
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
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  {/* Package Selector */}
                  <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200">
                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[11px] font-bold text-slate-600">Paket:</span>
                    <select
                      value={biz.subscription_plan}
                      disabled={actionBusyId === biz.id}
                      onChange={(e) => handleChangePlan(biz.id, e.target.value)}
                      className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-800"
                    >
                      <option value="free">Ücretsiz (Free)</option>
                      <option value="standard">Standart</option>
                      <option value="pro">Profesyonel</option>
                      <option value="enterprise">Kurumsal</option>
                    </select>
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
                      Yasakla / Askıya Al
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={actionBusyId === biz.id}
                      onClick={() => handleToggleBusinessBan(biz, true)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Yasağı Kaldır (Aktif Et)
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: SUPPORT TICKETS & SCAM REPORTS */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: 'all', label: `Tüm Talepler (${tickets.length})` },
              { key: 'open', label: `Bekleyenler (${openTicketCount})` },
              {
                key: 'complaint',
                label: `🚨 Şikayet & İhbarlar (${tickets.filter((t) => t.category === 'complaint').length})`,
              },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setTicketFilter(f.key as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold ${
                  ticketFilter === f.key
                    ? 'bg-brand-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredTickets.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-500 text-xs">
              Henüz bu filtrede destek veya şikayet talebi bulunmuyor.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className={`bg-white rounded-2xl border p-5 shadow-sm space-y-3 ${
                    ticket.category === 'complaint'
                      ? 'border-rose-300 bg-rose-50/20'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            ticket.category === 'complaint'
                              ? 'bg-rose-600 text-white'
                              : ticket.category === 'billing'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {ticket.category === 'complaint'
                            ? '🚨 Şüpheli İşletme Şikayeti'
                            : ticket.category === 'billing'
                            ? '💳 Paket & Ödeme'
                            : ticket.category === 'suggestion'
                            ? '💡 Öneri'
                            : '🛠️ Teknik Destek'}
                        </span>
                        <h3 className="font-extrabold text-sm text-slate-900">{ticket.subject}</h3>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                        <span>Gönderen: <strong>{ticket.sender_name}</strong></span>
                        <span>İletişim: <strong>{ticket.sender_contact}</strong></span>
                        <span>Tarih: {new Date(ticket.created_at).toLocaleString('tr-TR')}</span>
                      </div>
                      {ticket.reported_business_slug && (
                        <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-100 text-rose-900 text-xs font-bold">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          Şikayet Edilen İşletme: {ticket.reported_business_slug}
                        </div>
                      )}
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        ticket.status === 'answered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ticket.status === 'closed'
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {ticket.status === 'answered'
                        ? '✓ Yanıtlandı'
                        : ticket.status === 'closed'
                        ? 'Kapatıldı'
                        : '⏳ Yanıt Bekliyor'}
                    </span>
                  </div>

                  {/* Live Conversation Thread */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 max-h-64 overflow-y-auto">
                    {(Array.isArray(ticket.messages) && ticket.messages.length > 0
                      ? ticket.messages
                      : [
                          {
                            sender: 'user' as const,
                            text: ticket.message,
                            created_at: ticket.created_at,
                          },
                          ...(ticket.admin_reply
                            ? [
                                {
                                  sender: 'admin' as const,
                                  text: ticket.admin_reply,
                                  created_at: ticket.replied_at || ticket.created_at,
                                },
                              ]
                            : []),
                        ]
                    ).map((msg, mIdx) => {
                      const isAdmin = msg.sender === 'admin';
                      return (
                        <div
                          key={mIdx}
                          className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                              isAdmin
                                ? 'bg-brand-600 text-white rounded-tr-sm'
                                : 'bg-white border border-slate-200 text-slate-900 rounded-tl-sm'
                            }`}
                          >
                            <div
                              className={`text-[10px] font-bold mb-0.5 ${
                                isAdmin ? 'text-brand-100' : 'text-slate-500'
                              }`}
                            >
                              {isAdmin ? '🛡️ Siz (RANDEVORY Destek Ekibi)' : `👤 ${ticket.sender_name}`}
                            </div>
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Admin Reply Box */}
                  <div className="pt-2 space-y-2">
                    <label className="block text-xs font-bold text-slate-700">
                      🛡️ Karşı Tarafa Canlı Mesaj Gönder:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Mesajınızı yazın (Karşı tarafın ekranına anında düşer ve o da tekrar yanıt yazabilir)..."
                        value={replyDrafts[ticket.id] ?? ''}
                        onChange={(e) =>
                          setReplyDrafts((prev) => ({ ...prev, [ticket.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleReplyTicket(ticket, 'answered');
                          }
                        }}
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                      />
                      <button
                        type="button"
                        disabled={actionBusyId === ticket.id}
                        onClick={() => handleReplyTicket(ticket, 'answered')}
                        className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center gap-1.5 shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Mesaj Gönder
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        {ticket.status !== 'closed' && (
                          <button
                            type="button"
                            disabled={actionBusyId === ticket.id}
                            onClick={() => handleReplyTicket(ticket, 'closed')}
                            className="px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs"
                          >
                            Görüşmeyi Çözüldü Olarak Kapat
                          </button>
                        )}
                      </div>

                      {/\d{10,}/.test(ticket.sender_contact.replace(/\D/g, '')) && (
                        <a
                          href={buildWhatsAppUrl(
                            ticket.sender_contact,
                            `Merhaba ${ticket.sender_name}, RANDEVORY Destek Ekibi'nden ulaşıyoruz. "${ticket.subject}" konulu destek talebiniz hakkında:`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          WhatsApp&apos;tan Yaz
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
              Buradan tüm sitede en üstte görünecek bir duyuru/kampanya mesajı yayınlayabilir veya canlı destek WhatsApp numaranızı belirleyebilirsiniz.
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

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Duyuru Metni
            </label>
            <input
              type="text"
              placeholder="Örn: 🎉 RANDEVORY Lansmanına Özel Standart ve Profesyonel Paketlerde %20 İndirim!"
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Destek Ekibi WhatsApp Numarası (Opsiyonel)
            </label>
            <input
              type="text"
              placeholder="Örn: 05XX XXX XX XX (Boş bırakılırsa sadece site içi destek formu görünür)"
              value={supportWhatsapp}
              onChange={(e) => setSupportWhatsapp(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={savingSettings}
            className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-all"
          >
            {savingSettings ? 'Kaydediliyor...' : 'Ayarları Kaydet ve Yayınla'}
          </button>
        </form>
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
    </div>
  );
}
