'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { repo } from '@/lib/supabase-repository';
import { Business } from '@/types';
import { BrandLogo } from '@/components/brand-logo';
import { BusinessQrModal } from '@/components/business-qr-modal';
import {
  Calendar,
  LayoutDashboard,
  Users,
  Scissors,
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
      repo.getUnreadBusinessMessagesCount(activeBiz.id).then((cnt) => setUnreadMessages(cnt));
    }, 6000);
    return () => clearInterval(timer);
  }, [activeBiz]);

  const handleLogout = async () => {
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    router.push('/login');
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
    { name: 'Hizmetler & Fiyatlar', href: '/dashboard/services', icon: Scissors },
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

      {/* Mobile Header */}
      <header className="md:hidden bg-slate-900 text-white h-16 px-4 flex items-center justify-between sticky top-0 z-40 border-b border-slate-800">
        <BrandLogo size="sm" variant="dark" showBadge={false} showSlogan={false} />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="text-xs bg-slate-800 text-brand-300 px-2.5 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1"
          >
            <QrCode className="w-3.5 h-3.5" /> QR
          </button>
          <Link
            href={publicBookingUrl}
            target="_blank"
            className="text-xs bg-slate-800 text-brand-300 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1"
          >
            Sayfayı Gör <ExternalLink className="w-3 h-3" />
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-slate-800 text-slate-300"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-slate-950/80 backdrop-blur-sm pt-16">
          <nav className="p-4 bg-slate-900 border-b border-slate-800 space-y-1">
            {navigation.map((item: any) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                    isActive ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
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
            <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between px-3.5 py-2">
              <div className="text-xs text-slate-300 truncate">{currentUser?.email}</div>
              <button
                onClick={handleLogout}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4" /> Çıkış Yap
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-x-hidden min-h-screen">
        {/* Top Navbar */}
        <header className="hidden md:flex h-16 bg-white border-b border-slate-200 px-8 items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span className="font-medium text-slate-800">Yönetim Paneli</span>
            <span>/</span>
            <span className="font-semibold text-brand-600">{activeNavTitle}</span>
          </div>

          <div className="flex items-center gap-3">
            {isSuperAdmin && (
              <Link
                href="/dashboard/admin"
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-300 flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Kurucu / Admin Paneli
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
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto flex-1">
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

      <BusinessQrModal
        businessName={activeBiz?.name || 'Salon Prestij'}
        slug={activeBiz?.slug || 'salon-prestij'}
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
      />
    </div>
  );
}
