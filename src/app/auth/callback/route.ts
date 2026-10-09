import { type NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ensureProfile } from '@/lib/auth';
import { sanitizeRedirectPath } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next');

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Ensure idempotent citizen profile for OAuth first-time login
      const profile = await ensureProfile(data.user);
      const safePath = sanitizeRedirectPath(next, profile.role);
      return NextResponse.redirect(new URL(safePath, requestUrl.origin));
    }
  }

  // Auth exchange failed or code missing
  return NextResponse.redirect(new URL('/login?error=auth_failed', requestUrl.origin));
}
