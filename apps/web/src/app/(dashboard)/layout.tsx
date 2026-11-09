'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { repo } from '@/lib/supabase-repository';
import { Business } from '@/types';
import { BrandLogo } from '@/components/brand-logo';
import { BusinessQrModal } from '@/components/business-qr-modal';
import { triggerPwaInstall, checkIsPwaStandalone } from '@/components/pwa-install-prompt';
import {
  registerServiceWorker,
  requestNotificationPermission,
  getNotificationPermission,
  sendAppNotification,
} from '@/lib/notification-manager';
import {
  Calendar,
  LayoutDashboard,
  Users,
  Sparkles,
  UtensilsCrossed,
  UserCheck,
  TrendingUp,
  Settings,
  ExternalLink,
  Menu,
  X,
  CreditCard,
  LogOut,
  Bell,
  MessageSquare,
  QrCode,
  ShieldCheck,
  Smartphone,
  Download,
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ email?: string; name?: string } | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [openSupportTickets, setOpenSupportTickets] = useState<number>(0);
  const [activeBiz, setActiveBiz] = useState<Business | null>(null);
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
  const [showQrModal, setShowQrModal] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const [inAppToast, setInAppToast] = useState<{ title: string; body: string; url?: string } | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  // Initialize Service Worker & check Notification Permission & PWA Mode
  useEffect(() => {
    registerServiceWorker();
    setNotifPermission(getNotificationPermission());
    setIsStandalone(checkIsPwaStandalone());

    const handleInAppAlert = (e: any) => {
      if (e.detail) {
        setInAppToast(e.detail);
        setTimeout(() => setInAppToast(null), 7000);
      }
    };
    window.addEventListener('randevory-inapp-alert', handleInAppAlert);
    return () => window.removeEventListener('randevory-inapp-alert', handleInAppAlert);
  }, []);

  const handleRequestNotifs = async () => {
    const perm = await requestNotificationPermission();
    setNotifPermission(perm);
  };

  // Real-time Supabase Web Push listener for Appointments & Messages
  useEffect(() => {
    if (!activeBiz || !isSupabaseConfigured()) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`biz-live-alerts-${activeBiz.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `business_id=eq.${activeBiz.id}`,
        },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            const appt = payload.new;
            const timeStr = appt.start_time
              ? new Date(appt.start_time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
              : '';
            sendAppNotification({
              title: '🗓️ Yeni Randevu Geldi!',
              body: `${appt.customer_name || 'Müşteri'} – ${timeStr}`,
              url: '/dashboard/calendar',
              tag: `appt-${appt.id}`,
            });
            window.dispatchEvent(new CustomEvent('randevory-appointment-updated'));
          } else if (payload.eventType === 'UPDATE' && payload.new?.status === 'cancelled') {
            const appt = payload.new;
            sendAppNotification({
              title: '❌ Randevu İptali',
              body: `${appt.customer_name || 'Müşteri'} randevusunu iptal etti.`,
              url: '/dashboard/calendar',
              tag: `appt-cancel-${appt.id}`,
            });
            window.dispatchEvent(new CustomEvent('randevory-appointment-updated'));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `business_id=eq.${activeBiz.id}`,
        },
        (payload: any) => {
          const msg = payload.new;
          if (msg && msg.sender_type === 'customer') {
            setUnreadMessages((prev) => prev + 1);
            sendAppNotification({
              title: `💬 Yeni Müşteri Mesajı: ${msg.customer_name || 'Müşteri'}`,
              body: msg.message || 'Yeni bir mesaj aldınız.',
              url: '/dashboard/messages',
              tag: `chat-${msg.id}`,
            });
            window.dispatchEvent(new CustomEvent('randevory-message-received', { detail: msg }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeBiz]);

  useEffect(() => {
    repo.getActiveBusiness().then((b) => {
      if (b) {
        setActiveBiz(b);
        repo.getUnreadBusinessMessagesCount(b.id).then((cnt) => setUnreadMessages(cnt));
      } else if (pathname.startsWith('/dashboard') && pathname !== '/dashboard/admin') {
        router.push('/create-business');
      }
    });

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      supabase.auth.getUser().then(async ({ data: { user }, error }) => {
        if (!user || error) {
          router.push('/login');
          return;
        }
        setCurrentUser({
          email: user.email,
          name: user.user_metadata?.full_name || user.email?.split('@')[0],
        });

        const isAdminEmail = user.email?.toLowerCase() === 'kumar.baz230@gmail.com';
        if (isAdminEmail) {
          setIsSuperAdmin(true);
          const { count } = await supabase
            .from('platform_support_tickets')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'open');
          setOpenSupportTickets(count || 0);
        }
      });
    }
  }, [pathname, router]);

  // Poll unread messages count periodically + listen for business updates
  useEffect(() => {
    const onBizUpdated = (e: Event) => {
      const customEv = e as CustomEvent<Business>;
      if (customEv.detail) {
        setActiveBiz(customEv.detail);
      } else {
        repo.getActiveBusiness().then((b) => b && setActiveBiz(b));
      }
    };
    window.addEventListener('randevory-business-updated', onBizUpdated);
    return () => window.removeEventListener('randevory-business-updated', onBizUpdated);
  }, []);

  useEffect(() => {
    if (!activeBiz) return;
    const timer = setInterval(() => {
      if (document.hidden) return; // sekme arka plandaysa sorgu atma
      repo.getUnreadBusinessMessagesCount(activeBiz.id).then((cnt) => setUnreadMessages(cnt));
    }, 20000);
    return () => clearInterval(timer);
  }, [activeBiz]);

  const handleLogout = async () => {
    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      repo.invalidateActiveBusinessCache();
      window.location.href = '/login';
    }
  };

  const navigation = [
    ...(isSuperAdmin
      ? [
          {
            name: 'Kurucu & Destek Admin',
            href: '/dashboard/admin',
            icon: ShieldCheck,
            badge: openSupportTickets,
            highlightAdmin: true,
          },
        ]
      : []),
    { name: 'Genel Bakış', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Randevu Takvimi', href: '/dashboard/calendar', icon: Calendar },
    { name: 'Müşteri Mesajları', href: '/dashboard/messages', icon: MessageSquare, badge: unreadMessages },
    { name: 'Hizmetler & Fiyatlar', href: '/dashboard/services', icon: Sparkles },
    ...(activeBiz?.sector === 'cafe_restaurant' ||
    activeBiz?.sector === 'activity_gaming' ||
    activeBiz?.settings?.enable_table_booking
      ? [{ name: 'Masalar & Alanlar', href: '/dashboard/tables', icon: UtensilsCrossed }]
      : []),
    { name: 'Personel Yönetimi', href: '/dashboard/staff', icon: UserCheck },
    { name: 'Müşteriler (CRM)', href: '/dashboard/customers', icon: Users },
    { name: 'Raporlar & Gelir', href: '/dashboard/reports', icon: TrendingUp },
    { name: 'Abonelik & Lisans', href: '/dashboard/billing', icon: CreditCard },
    { name: 'İşletme Ayarları', href: '/dashboard/settings', icon: Settings },
  ];

  const activeNavTitle =
    navigation.find((item) => item.href === pathname)?.name || 'Genel Bakış';

  const publicBookingUrl = `/${activeBiz?.slug || 'salon-prestij'}`;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 shrink-0 border-r border-slate-800">
        {/* Brand */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800">
          <BrandLogo size="sm" variant="dark" showBadge={true} showSlogan={false} />
        </div>

        {/* Business Selector Preview */}
        <div className="p-4 border-b border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Aktif İşletme</span>
              <Link href="/create-business" title="Yeni İşletme Ekle" className="text-[10px] text-brand-400 hover:text-brand-300 font-bold">
                + Yeni
              </Link>
            </div>
            <div className="font-bold text-white text-sm truncate mt-0.5">
              {activeBiz?.name || 'Salon Prestij'}
            </div>
            <div className="mt-2.5 flex items-center justify-between gap-2 pt-2 border-t border-slate-700/60">
              <Link
                href={publicBookingUrl}
                target="_blank"
                className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-medium"
              >
                Sayfayı Gör <ExternalLink className="w-3 h-3" />
              </Link>
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="px-2 py-1 rounded-lg bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 text-[11px] font-semibold flex items-center gap-1 transition-colors"
              >
                <QrCode className="w-3 h-3" /> QR Kod
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item: any) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20 font-semibold'
                    : item.highlightAdmin
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 font-bold mb-2'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive
                        ? 'text-white'
                        : item.highlightAdmin
                        ? 'text-emerald-400'
                        : 'text-slate-400'
                    }`}
                  />
                  {item.name}
                </span>
                {item.badge && item.badge > 0 ? (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white text-brand-700' : 'bg-rose-500 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* PWA Install Button for Desktop / Tablet (Only if not already running as installed app) */}
        {!isStandalone && (
          <div className="px-4 py-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={triggerPwaInstall}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white text-xs font-medium transition-colors"
            >
              <span className="flex items-center gap-2">
                <Smartphone className="w-3.5 h-3.5 text-brand-400" />
                Uygulamayı Yükle
              </span>
              <Download className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        )}

        {/* Bottom User info */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white text-xs">
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'AK'}
            </div>
            <div className="overflow-hidden">
              <div className="font-semibold text-white truncate max-w-[110px]">
                {currentUser?.name || 'İşletme Yöneticisi'}
              </div>
              <div className="text-slate-500 text-[10px] truncate max-w-[110px]">
                {currentUser?.email || 'İşletme Sahibi'}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Çıkış Yap"
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Mobile Header (sade: logo + sayfa başlığı + menü) */}
      <header className="md:hidden bg-slate-900 text-white h-14 px-3 flex items-center justify-between sticky top-0 z-40 border-b border-slate-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <BrandLogo size="sm" variant="dark" showBadge={false} showSlogan={false} />
        </div>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs font-semibold text-slate-300 truncate max-w-[120px]">{activeNavTitle}</span>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menü"
            className="p-2 rounded-lg bg-slate-800 text-slate-200 shrink-0"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer (tam ekran, kaydırılabilir) */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-slate-950/80 backdrop-blur-sm pt-14 pb-16">
          <nav className="h-full overflow-y-auto p-4 bg-slate-900 space-y-1">
            {/* Notification Permission Quick Card on Mobile */}
            {notifPermission !== 'granted' && (
              <button
                type="button"
                onClick={handleRequestNotifs}
                className="w-full mb-3 p-3 rounded-2xl bg-gradient-to-r from-amber-600/30 to-amber-500/20 border border-amber-400/50 text-left flex items-center justify-between text-amber-200 transition-colors animate-pulse"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-900 flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Telefon Bildirimlerini Aç</div>
                    <div className="text-[10px] text-amber-300">Yeni randevular anında cebinize gelsin</div>
                  </div>
                </div>
                <span className="text-[10px] bg-amber-400 text-slate-900 font-extrabold px-2.5 py-1 rounded-lg shrink-0">
                  Aç
                </span>
              </button>
            )}

            {/* Aktif işletme + hızlı işlemler */}
            <div className="p-3 mb-3 rounded-2xl bg-slate-800/70 border border-slate-700/60">
              <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Aktif İşletme</div>
              <div className="font-bold text-white text-sm truncate mt-0.5">{activeBiz?.name || 'Salon Prestij'}</div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowQrModal(true);
                  }}
                  className="py-2.5 rounded-xl bg-brand-500/20 text-brand-300 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <QrCode className="w-4 h-4" /> QR Kod
                </button>
                <Link
                  href={publicBookingUrl}
                  target="_blank"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 rounded-xl bg-slate-700/70 text-slate-100 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  Sayfayı Gör <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Install PWA Mobile Action (Only if not already running as installed app) */}
              {!isStandalone && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    triggerPwaInstall();
                  }}
                  className="w-full mt-2.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-brand-600/30 to-blue-600/20 border border-brand-500/40 text-left flex items-center justify-between transition-colors active:scale-98"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-brand-600 text-white flex items-center justify-center shrink-0">
                      <Smartphone className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        Uygulama Olarak Ekle
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-brand-500 text-white font-semibold">Tavsiye</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Ana ekrandan tek tıkla hızlı açın</div>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-brand-400 shrink-0" />
                </button>
              )}
            </div>

            {navigation.map((item: any) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium ${
                    isActive
                      ? 'bg-brand-600 text-white'
                      : item.highlightAdmin
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </span>
                  {item.badge && item.badge > 0 ? (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
            <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between gap-3 px-3.5 py-2">
              <div className="text-xs text-slate-300 truncate min-w-0">{currentUser?.email}</div>
              <button
                onClick={handleLogout}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1.5 shrink-0"
              >
                <LogOut className="w-4 h-4" /> Çıkış Yap
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Mobile Bottom Tab Bar (en sık kullanılan 4 sayfa + Menü) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 shadow-[0_-4px_16px_rgba(15,23,42,0.06)] safe-bottom">
        <div className="grid grid-cols-5">
          {[
            { name: 'Genel', href: '/dashboard', icon: LayoutDashboard },
            { name: 'Takvim', href: '/dashboard/calendar', icon: Calendar },
            { name: 'Mesajlar', href: '/dashboard/messages', icon: MessageSquare, badge: unreadMessages },
            { name: 'Hizmetler', href: '/dashboard/services', icon: Sparkles },
          ].map((tab) => {
            const TabIcon = tab.icon;
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`relative flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold ${
                  active ? 'text-brand-600' : 'text-slate-500'
                }`}
              >
                <span className="relative">
                  <TabIcon className="w-5 h-5" />
                  {tab.badge && tab.badge > 0 ? (
                    <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center">
                      {tab.badge > 9 ? '9+' : tab.badge}
                    </span>
                  ) : null}
                </span>
                {tab.name}
                {active && <span className="absolute top-0 inset-x-4 h-0.5 rounded-full bg-brand-600" />}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold ${
              mobileMenuOpen ? 'text-brand-600' : 'text-slate-500'
            }`}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            Menü
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col overflow-x-hidden min-h-screen">
        {/* Top Navbar */}
        <header className="hidden md:flex h-16 bg-white border-b border-slate-200 px-8 items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span className="font-medium text-slate-800">İşletme Tablosu</span>
            <span>/</span>
            <span className="font-semibold text-brand-600">{activeNavTitle}</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Permission Toggle */}
            {notifPermission !== 'granted' ? (
              <button
                type="button"
                onClick={handleRequestNotifs}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 flex items-center gap-1.5 transition-colors border border-amber-300 shadow-2xs animate-pulse"
                title="Yeni randevu ve mesajları kaçırmamak için bildirimleri açın"
              >
                <Bell className="w-3.5 h-3.5 text-amber-600" /> Bildirimleri Aç
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRequestNotifs}
                title="Bildirimler Aktif - Test bildirimi almak için tıklayın"
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 flex items-center gap-1.5 border border-emerald-200 transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px]">Bildirimler Açık</span>
              </button>
            )}

            {isSuperAdmin && (
              <Link
                href="/dashboard/admin"
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-300 flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Kurucu Merkezi
                {openSupportTickets > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px]">
                    {openSupportTickets}
                  </span>
                )}
              </Link>
            )}
            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 flex items-center gap-1.5 transition-colors border border-brand-200"
            >
              <QrCode className="w-3.5 h-3.5" /> QR Kod & Afiş İndir
            </button>
            <Link
              href={publicBookingUrl}
              target="_blank"
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-colors border border-slate-200"
            >
              Müşteri Ekranını Aç <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/dashboard/messages"
              title="Müşteri Mesajları"
              className="relative w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 cursor-pointer hover:bg-slate-200"
            >
              <Bell className="w-4 h-4" />
              {unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-3 pb-24 sm:p-6 md:pb-6 lg:p-8 max-w-7xl w-full min-w-0 mx-auto flex-1">
          {activeBiz && activeBiz.is_active === false && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-600 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs sm:text-sm font-bold">
                🚫 İşletme sayfanız RANDEVORY Güvenlik ve Destek Ekibi tarafından askıya alınmıştır. Müşteri randevu alımı şu an kapalıdır.{(activeBiz as any).ban_reason ? ` (Neden: ${(activeBiz as any).ban_reason})` : ''}
              </div>
              <span className="text-[11px] bg-white/20 px-3 py-1.5 rounded-xl font-semibold shrink-0">
                Sağ alttaki Canlı Destek butonundan itiraz edebilirsiniz
              </span>
            </div>
          )}
          {children}
        </main>
      </div>

      {/* In-App Real-Time Floating Notification Toast */}
      {inAppToast && (
        <div className="fixed top-4 inset-x-4 sm:inset-x-auto sm:right-6 z-50 max-w-sm w-full bg-slate-900/95 backdrop-blur text-white rounded-2xl p-4 shadow-2xl border border-slate-700 animate-in slide-in-from-top-4 fade-in">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <Bell className="w-4 h-4 animate-bounce" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">{inAppToast.title}</div>
                <div className="text-[11px] text-slate-300 line-clamp-2 mt-0.5">{inAppToast.body}</div>
                {inAppToast.url && (
                  <Link
                    href={inAppToast.url}
                    onClick={() => setInAppToast(null)}
                    className="inline-flex items-center gap-1 text-[11px] text-brand-400 font-semibold hover:underline mt-1.5"
                  >
                    Görüntüle &rarr;
                  </Link>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setInAppToast(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white shrink-0"
              aria-label="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <BusinessQrModal
        businessName={activeBiz?.name || 'Salon Prestij'}
        slug={activeBiz?.slug || 'salon-prestij'}
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
      />
    </div>
  );
}
