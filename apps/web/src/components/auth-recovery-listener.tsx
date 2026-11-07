'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

/**
 * Supabase e-posta bağlantıları (özellikle Site URL fallback durumunda)
 * kullanıcıyı ana sayfaya (/?code=... veya /#access_token=...&type=recovery)
 * yönlendirdiğinde otomatik yakalayıp /reset-password veya /auth/callback'e iletir.
 */
export function AuthRecoveryListener() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Hash içinde type=recovery varsa ve henüz /reset-password sayfasında değilsek
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery') && pathname !== '/reset-password') {
      router.replace(`/reset-password${hash}`);
      return;
    }

    // 2. Ana sayfaya ?code=... veya ?token_hash=... ile düşüldüyse /auth/callback'e yönlendir
    const search = window.location.search;
    if (pathname === '/' && search) {
      const params = new URLSearchParams(search);
      const code = params.get('code');
      const tokenHash = params.get('token_hash');
      const type = params.get('type');
      const errorCode = params.get('error_code');

      if (errorCode === 'otp_expired' || params.get('error') === 'access_denied') {
        router.replace(`/reset-password?error=expired`);
        return;
      }

      if (type === 'recovery' && (code || tokenHash)) {
        router.replace(`/reset-password${search}`);
        return;
      }

      if (code || tokenHash) {
        router.replace(`/auth/callback${search}`);
        return;
      }
    }

    if (!isSupabaseConfigured()) return;

    const supabase = createClient();
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' && pathname !== '/reset-password') {
        router.replace('/reset-password');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [pathname, router]);

  return null;
}
