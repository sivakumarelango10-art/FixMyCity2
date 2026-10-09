import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ensureProfile } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const origin = new URL(request.url).origin;

  if (token_hash && type) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error && data.user) {
      if (type === 'recovery') {
        return NextResponse.redirect(new URL('/reset-password', origin));
      }

      await ensureProfile(data.user);
      return NextResponse.redirect(new URL('/auth/redirect', origin));
    }
  }

  return NextResponse.redirect(new URL('/login?error=invalid_or_expired_link', origin));
}
