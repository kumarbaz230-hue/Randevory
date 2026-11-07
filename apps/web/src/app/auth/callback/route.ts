import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as any;
  const next = searchParams.get('next');
  const errorParam = searchParams.get('error');
  const errorDesc = searchParams.get('error_description');

  // Eğer Supabase hata döndürdüyse (ör. otp_expired) ve şifre sıfırlama akışıysa
  if (errorParam) {
    if (next === '/reset-password' || type === 'recovery') {
      return NextResponse.redirect(
        `${origin}/reset-password?error=expired&error_description=${encodeURIComponent(
          errorDesc || 'Şifre sıfırlama bağlantınızın süresi dolmuş.'
        )}`
      );
    }
    return NextResponse.redirect(`${origin}/login?error=auth-code-error`);
  }

  const supabase = await createServerSupabaseClient();

  // 1. PKCE Auth Code akışı
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Şifre sıfırlama akışıysa doğrudan /reset-password ekranına yönlendir
      if (next === '/reset-password' || type === 'recovery') {
        return NextResponse.redirect(`${origin}/reset-password`);
      }

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
    } else if (next === '/reset-password' || type === 'recovery') {
      // Farklı tarayıcıdan açıldığı için PKCE code_verifier bulunamadıysa client-side /reset-password'a ilet
      return NextResponse.redirect(`${origin}/reset-password?code=${encodeURIComponent(code)}`);
    }
  }

  // 2. OTP Token Hash (E-posta doğrulama veya şifre kurtarma linki) akışı
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) {
      if (type === 'recovery' || next === '/reset-password') {
        return NextResponse.redirect(`${origin}/reset-password`);
      }

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
    } else if (type === 'recovery' || next === '/reset-password') {
      return NextResponse.redirect(`${origin}/reset-password?error=expired`);
    }
  }

  if (next === '/reset-password' || type === 'recovery') {
    return NextResponse.redirect(`${origin}/reset-password?error=expired`);
  }

  // Hata durumunda bilgilendirici parametreyle login'e yönlendir
  return NextResponse.redirect(`${origin}/login?error=auth-code-error`);
}
