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

  const isRecoveryRedirect =
    next === '/reset-password' ||
    next === '/dashboard/settings' ||
    type === 'recovery';

  if (errorParam) {
    if (isRecoveryRedirect) {
      return NextResponse.redirect(
        `${origin}/reset-password?error=expired&error_description=${encodeURIComponent(
          errorDesc || 'Şifre sıfırlama bağlantınızın süresi dolmuş.'
        )}`
      );
    }
    return NextResponse.redirect(`${origin}/reset-password?error=expired`);
  }

  const supabase = await createServerSupabaseClient();

  // 1. PKCE Auth Code akışı
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (isRecoveryRedirect) {
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
    } else {
      // PKCE code_verifier uyuşmazlığı durumunda (ör. eski e-posta linki veya farklı tarayıcı)
      // kullanıcıyı login hatası yerine doğrudan /reset-password ekranına yönlendir
      return NextResponse.redirect(`${origin}/reset-password?error=expired`);
    }
  }

  // 2. OTP Token Hash akışı
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) {
      if (isRecoveryRedirect) {
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
    } else {
      return NextResponse.redirect(`${origin}/reset-password?error=expired`);
    }
  }

  // Eğer URL'de #access_token=... gibi bir hash varsa sunucu bunu göremez;
  // İstemci tarafında hash'i koruyarak /reset-password'a aktaran hafif bir köprü döndür:
  return new NextResponse(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><script>
      if (window.location.hash && window.location.hash.includes('access_token')) {
        window.location.replace('/reset-password' + window.location.hash);
      } else {
        window.location.replace('/reset-password?error=expired');
      }
    </script></head><body>Yönlendiriliyor...</body></html>`,
    {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    }
  );
}
