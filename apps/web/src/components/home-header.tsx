'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  Menu,
  X,
  Star,
  Sparkles,
  CreditCard,
  Layers,
  BookOpen,
  ArrowRight,
  LayoutDashboard,
  UserCheck,
  ChevronRight,
  ShieldCheck,
  Scissors,
} from 'lucide-react';

export function HomeHeader() {
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null);
  const [checked, setChecked] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setChecked(true);
      return;
    }

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) {
        setUser({
          email: u.email,
          name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'Hesabım',
        });
      }
      setChecked(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          email: session.user.email,
          name:
            session.user.user_metadata?.full_name ||
            session.user.email?.split('@')[0] ||
            'Hesabım',
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    const elem = document.getElementById(targetId);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.pushState(null, '', `#${targetId}`);
    }
  };

  const navItems = [
    { id: 'features', label: 'Özellikler', icon: Sparkles },
    { id: 'nasil-calisir', label: 'Nasıl Kullanılır?', icon: BookOpen },
    { id: 'sectors', label: 'Sektörler', icon: Scissors },
    {
      id: 'yorumlar',
      label: 'Yorumlar',
      icon: Star,
      badge: '4.7',
      highlight: true,
    },
    { id: 'plans', label: 'Paketler', icon: CreditCard },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/95 border-b border-slate-200/90 shadow-sm">
      {/* Main Top Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <BrandLogo size="md" showBadge={true} showSlogan={false} />

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-7 text-sm font-medium text-slate-600">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => handleNavClick(e, item.id)}
              className="hover:text-slate-900 transition-colors flex items-center gap-1.5"
            >
              {item.label}
              {item.badge && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {item.badge}
                </span>
              )}
            </a>
          ))}
        </nav>

        {/* Right Actions (Auth & Mobile Toggle) */}
        <div className="flex items-center gap-2">
          {/* User Auth Info (Desktop / Tablet) */}
          {user && (
            <span className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <UserCheck className="w-3.5 h-3.5" />
              {user.name}
            </span>
          )}

          {/* Primary Action Button */}
          {user ? (
            <Link
              href="/dashboard"
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-brand-600 text-white hover:bg-brand-700 shadow-sm transition-all flex items-center gap-1.5 shrink-0"
            >
              <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Yönetim Paneline Dön</span>
              <span className="sm:hidden">Panel</span>
            </Link>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link
                href="/login"
                className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-brand-600 px-2.5 py-2 transition-colors"
              >
                Giriş Yap
              </Link>
              <Link
                href="/register"
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-brand-600 text-white hover:bg-brand-700 shadow-sm transition-all flex items-center gap-1 shrink-0"
              >
                Kayıt Ol <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors flex items-center justify-center shrink-0"
            aria-label="Menüyü Aç/Kapat"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-slate-900" /> : <Menu className="w-5 h-5 text-slate-900" />}
          </button>
        </div>
      </div>

      {/* Mobile Horizontal Quick-Jump Pill Bar (Always visible on mobile right below the header) */}
      <div className="md:hidden border-t border-slate-200/80 bg-slate-50/95 backdrop-blur-md px-3 py-2 overflow-x-auto no-scrollbar scroll-smooth flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">Hızlı Git:</span>

        {/* 1. Yorumlar Pill (Highlighted) */}
        <a
          href="#yorumlar"
          onClick={(e) => handleNavClick(e, 'yorumlar')}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-500 text-white border border-amber-600 text-xs font-bold shrink-0 shadow-sm active:scale-95 transition-transform"
        >
          <Star className="w-3.5 h-3.5 fill-white text-white" />
          Yorumlar (4.7)
        </a>

        {/* 2. Paketler Pill */}
        <a
          href="#plans"
          onClick={(e) => handleNavClick(e, 'plans')}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white text-slate-800 border border-slate-300 text-xs font-semibold shrink-0 shadow-xs hover:border-brand-500 active:scale-95 transition-transform"
        >
          <CreditCard className="w-3.5 h-3.5 text-brand-600" />
          Paketler
        </a>

        {/* 3. Özellikler Pill */}
        <a
          href="#features"
          onClick={(e) => handleNavClick(e, 'features')}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white text-slate-800 border border-slate-300 text-xs font-semibold shrink-0 shadow-xs hover:border-brand-500 active:scale-95 transition-transform"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          Özellikler
        </a>

        {/* 4. Sektörler Pill */}
        <a
          href="#sectors"
          onClick={(e) => handleNavClick(e, 'sectors')}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white text-slate-800 border border-slate-300 text-xs font-semibold shrink-0 shadow-xs hover:border-brand-500 active:scale-95 transition-transform"
        >
          <Scissors className="w-3.5 h-3.5 text-purple-600" />
          Sektörler
        </a>

        {/* 5. Nasıl Çalışır Pill */}
        <a
          href="#nasil-calisir"
          onClick={(e) => handleNavClick(e, 'nasil-calisir')}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white text-slate-800 border border-slate-300 text-xs font-semibold shrink-0 shadow-xs hover:border-brand-500 active:scale-95 transition-transform"
        >
          <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
          Nasıl Çalışır?
        </a>
      </div>

      {/* Mobile Animated Dropdown Drawer (Opened via Hamburger Menu) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 shadow-xl animate-in slide-in-from-top-2 fade-in">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => handleNavClick(e, item.id)}
                  className={`flex items-center justify-between p-3 rounded-xl text-sm font-semibold transition-colors ${
                    item.highlight
                      ? 'bg-amber-50 text-amber-900 border border-amber-200'
                      : 'text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        item.highlight ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span>{item.label}</span>
                  </div>

                  {item.badge ? (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-xs font-bold">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {item.badge}
                    </span>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </a>
              );
            })}

            <Link
              href="/nasil-kullanilir"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-3 rounded-xl text-sm font-semibold text-brand-700 hover:bg-brand-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span>Adım Adım Detaylı Rehber</span>
              </div>
              <ChevronRight className="w-4 h-4 text-brand-400" />
            </Link>
          </div>

          {/* User profile / Auth in mobile drawer */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Giriş Yapıldı
                  </span>
                </div>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Yönetim Paneline Git
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-800 text-xs font-bold text-center hover:bg-slate-50 transition-colors"
                >
                  Giriş Yap
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-brand-600 text-white text-xs font-bold text-center hover:bg-brand-700 transition-colors shadow-sm"
                >
                  Kayıt Ol
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
