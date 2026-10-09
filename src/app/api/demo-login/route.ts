import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { env } from '@/lib/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { prisma } from '@/lib/db';
import { getRoleHome } from '@/lib/permissions';
import { ensureProfile } from '@/lib/auth';

const demoLoginSchema = z.object({
  role: z.enum(['CITIZEN', 'ADMIN', 'WORKER']),
});

const DEMO_ACCOUNTS: Record<z.infer<typeof demoLoginSchema>['role'], { email: string; name: string }> = {
  CITIZEN: {
    email: 'citizen@demo.fixmycity.app',
    name: 'Citizen Demo (Ravi Kumar)',
  },
  ADMIN: {
    email: 'admin@demo.fixmycity.app',
    name: 'Admin Demo (Priya Sharma)',
  },
  WORKER: {
    email: 'roads.worker@demo.fixmycity.app',
    name: 'Worker Demo (Suresh Reddy - Roads)',
  },
};

export async function POST(request: NextRequest) {
  // 1. Gating check: Must be permitted demo deployment
  if (!env.isDemoAllowed) {
    return NextResponse.json(
      { error: 'Demo authentication is disabled in this environment.' },
      { status: 403 }
    );
  }

  // 2. Same-origin CSRF validation
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');

  if (origin) {
    const originHost = new URL(origin).host;
    if (originHost !== host) {
      return NextResponse.json({ error: 'Cross-origin request rejected' }, { status: 403 });
    }
  }

  // 3. Body validation
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request' }, { status: 400 });
  }

  const parsed = demoLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid demo role requested. Allowed: CITIZEN, ADMIN, WORKER' },
      { status: 400 }
    );
  }

  const role = parsed.data.role;
  const demoUser = DEMO_ACCOUNTS[role];
  const demoPassword = env.DEMO_PASSWORD || 'DemoCitizen@2026!';

  try {
    const supabase = await createSupabaseServerClient();

    // Sign in using real Supabase Auth password with server-held secret
    let authRes = await supabase.auth.signInWithPassword({
      email: demoUser.email,
      password: demoPassword,
    });

    // Auto-provision demo account if missing in Supabase Auth and admin key is available
    if (authRes.error && env.SUPABASE_SECRET_KEY) {
      try {
        const adminSupabase = createSupabaseAdminClient();
        const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
          email: demoUser.email,
          password: demoPassword,
          email_confirm: true,
          user_metadata: { full_name: demoUser.name },
        });

        if (!createError && newUser.user) {
          // Retry login now that user exists
          authRes = await supabase.auth.signInWithPassword({
            email: demoUser.email,
            password: demoPassword,
          });
        }
      } catch (provisionErr) {
        console.warn('Could not auto-provision demo user via Supabase admin:', provisionErr);
      }
    }

    if (authRes.error || !authRes.data.user) {
      // In local mode without Supabase cloud keys or invalid remote password
      return NextResponse.json(
        {
          error:
            authRes.error?.message ||
            'Demo account sign-in failed. Verify Supabase demo user seeding.',
        },
        { status: 401 }
      );
    }

    const authUser = authRes.data.user;

    // Verify application profile and ensure role matches
    let profile = await prisma.profile.findUnique({
      where: { id: authUser.id },
      include: { department: true },
    });

    if (!profile) {
      profile = await ensureProfile(authUser, role, { fullName: demoUser.name });
    }

    if (!profile.isActive) {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: 'This demo account is marked inactive.' },
        { status: 403 }
      );
    }

    const redirectTo = getRoleHome(profile.role);

    return NextResponse.json({
      ok: true,
      role: profile.role,
      redirectTo,
    });
  } catch (err) {
    console.error('Demo login server error:', err);
    return NextResponse.json(
      { error: 'Internal demo authentication error' },
      { status: 500 }
    );
  }
}
