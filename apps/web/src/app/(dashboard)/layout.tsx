'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { repo } from '@/lib/supabase-repository';
import { Business } from '@/types';
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
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ email?: string; name?: string } | null>(null);
  const [activeBiz, setActiveBiz] = useState<Business | null>(null);

  useEffect(() => {
    repo.getActiveBusiness().then((b) => {
      if (b) {
        setActiveBiz(b);
      } else if (pathname.startsWith('/dashboard')) {
        // Kullanıcı giriş yapmış ama henüz bir işletmesi yok, işletme oluşturmaya yönlendir
        router.push('/create-business');
      }
    });

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user }, error }) => {
        if (!user || error) {
          router.push('/login');
          return;
        }
        setCurrentUser({
          email: user.email,
          name: user.user_metadata?.full_name || user.email?.split('@')[0],
        });
      });
    }
  }, [pathname]);

  const handleLogout = async () => {
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    router.push('/login');
  };

  const navigation = [
    { name: 'Genel Bakış', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Randevu Takvimi', href: '/dashboard/calendar', icon: Calendar },
    { name: 'Hizmetler & Fiyatlar', href: '/dashboard/services', icon: Scissors },
    { name: 'Personel Yönetimi', href: '/dashboard/staff', icon: UserCheck },
    { name: 'Müşteriler (CRM)', href: '/dashboard/customers', icon: Users },
    { name: 'Raporlar & Gelir', href: '/dashboard/reports', icon: TrendingUp },
    { name: 'İşletme Ayarları', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 shrink-0 border-r border-slate-800">
        {/* Brand */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800">
          <Link href="/" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold shadow-sm">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-white tracking-wider text-base">RANDEVO</span>
          </Link>
          <span className="text-[10px] bg-brand-500/20 text-brand-400 font-semibold px-2 py-0.5 rounded-full border border-brand-500/30">
            PRO
          </span>
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
            <Link
              href={`/${activeBiz?.slug || 'salon-prestij'}`}
              target="_blank"
              className="mt-2 text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-medium"
            >
              Randevu Sayfasını Gör <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {item.name}
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
                {currentUser?.name || 'Ahmet Karaca'}
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
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold">
            <Calendar className="w-4 h-4" />
          </div>
          <span className="font-bold text-white">RANDEVO</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/salon-prestij"
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
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                    isActive ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
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
            <span className="capitalize">{pathname.split('/')[2] || 'Genel Bakış'}</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/salon-prestij"
              target="_blank"
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-colors border border-slate-200"
            >
              Müşteri Ekranını Aç <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 cursor-pointer hover:bg-slate-200">
              <Bell className="w-4 h-4" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
