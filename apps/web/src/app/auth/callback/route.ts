import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as any;
  const next = searchParams.get('next');

  const supabase = await createServerSupabaseClient();

  // 1. PKCE Auth Code akışı
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Kullanıcının işletmesi var mı kontrol et
        const { data: member } = await supabase
          .from('business_members')
          .select('business_id')
          .eq('user_id', user.id)
          .maybeSingle();

        const destination = next || (member ? '/dashboard' : '/create-business');
        return NextResponse.redirect(`${origin}${destination}`);
      }
      return NextResponse.redirect(`${origin}${next || '/dashboard'}`);
    }
  }

  // 2. OTP Token Hash (E-posta doğrulama linki) akışı
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: member } = await supabase
          .from('business_members')
          .select('business_id')
          .eq('user_id', user.id)
          .maybeSingle();

        const destination = next || (member ? '/dashboard' : '/create-business');
        return NextResponse.redirect(`${origin}${destination}`);
      }
      return NextResponse.redirect(`${origin}${next || '/dashboard'}`);
    }
  }

  // Hata durumunda bilgilendirici parametreyle login'e yönlendir
  return NextResponse.redirect(`${origin}/login?error=auth-code-error`);
}
