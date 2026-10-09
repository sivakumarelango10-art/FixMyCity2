import { type NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  // Validate Origin header for CSRF defense
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  const requestUrl = new URL(request.url);

  if (origin) {
    const originHost = new URL(origin).host;
    if (originHost !== host) {
      return new NextResponse('Invalid origin', { status: 403 });
    }
  }

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL('/login', requestUrl.origin), {
    status: 303, // See Other
  });
}

export async function GET() {
  return new NextResponse('Method Not Allowed. Signout requires POST.', {
    status: 405,
    headers: { Allow: 'POST' },
  });
}
