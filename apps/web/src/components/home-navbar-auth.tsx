'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { ArrowRight, LayoutDashboard, UserCheck } from 'lucide-react';

export function HomeNavbarAuth() {
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null);
  const [checked, setChecked] = useState(false);

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

  if (!checked) {
    return (
      <div className="flex items-center space-x-3">
        <Link
          href="/dashboard"
          className="px-4 py-2 text-sm font-semibold rounded-lg bg-brand-600 text-white hover:bg-brand-700 shadow-sm transition-all flex items-center gap-2"
        >
          Yönetim Paneli <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
          <UserCheck className="w-3.5 h-3.5" />
          {user.name}
        </span>
        <Link
          href="/dashboard"
          className="px-4 py-2 text-sm font-semibold rounded-xl bg-brand-600 text-white hover:bg-brand-700 shadow-sm transition-all flex items-center gap-2"
        >
          <LayoutDashboard className="w-4 h-4" />
          Yönetim Paneline Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      <Link
        href="/login"
        className="text-sm font-semibold text-slate-700 hover:text-brand-600 px-3 py-2 transition-colors"
      >
        Giriş Yap
      </Link>
      <Link
        href="/register"
        className="px-4 py-2 text-sm font-semibold rounded-lg bg-brand-600 text-white hover:bg-brand-700 shadow-sm transition-all flex items-center gap-2"
      >
        Kayıt Ol <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
