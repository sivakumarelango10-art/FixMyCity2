import 'server-only';
import { redirect } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { Role, Profile, Department } from '@prisma/client';
import { createSupabaseServerClient } from './supabase/server';
import { prisma } from './db';
import { getRoleHome } from './permissions';

export type CurrentUser = Profile & {
  department: Department | null;
};

/**
 * Idempotently creates a citizen profile for a Supabase Auth user if absent.
 * Concurrency-safe: never overwrites existing role, department, or active status.
 */
export async function ensureProfile(
  user: User,
  defaultRole: Role = 'CITIZEN',
  metadata?: { fullName?: string; phone?: string }
): Promise<CurrentUser> {
  const existing = await prisma.profile.findUnique({
    where: { id: user.id },
    include: { department: true },
  });

  if (existing) {
    return existing;
  }

  const email = user.email?.toLowerCase().trim() || `${user.id}@user.fixmycity.local`;
  const rawFullName =
    metadata?.fullName ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    email.split('@')[0] ||
    'Citizen';
  const fullName = String(rawFullName).slice(0, 80);
  const phone = metadata?.phone || (user.user_metadata?.phone ? String(user.user_metadata.phone) : null);

  // Safe upsert with no-op update to resolve concurrent registration races
  const profile = await prisma.profile.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email,
      fullName,
      phone,
      role: defaultRole,
      isActive: true,
    },
    update: {},
    include: { department: true },
  });

  return profile;
}

/**
 * Validates session identity on server, fetches application profile, checks isActive.
 * Returns null if unauthenticated, disabled, or profile missing.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    let profile = await prisma.profile.findUnique({
      where: { id: user.id },
      include: { department: true },
    });

    if (!profile) {
      profile = await ensureProfile(user);
    }

    if (!profile.isActive) {
      return null;
    }

    return profile;
  } catch (err) {
    console.error('Failed to get current user:', err);
    return null;
  }
}

/**
 * Server guard: requires active authenticated user. Redirects to /login if unauthenticated.
 */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}

/**
 * Server guard: requires active user with one of specified roles.
 * On role mismatch, safely redirects to the user's canonical role home (preventing loops).
 */
export async function requireRole(...roles: Role[]): Promise<CurrentUser> {
  const user = await requireUser();

  if (!roles.includes(user.role)) {
    const correctHome = getRoleHome(user.role);
    redirect(correctHome);
  }

  return user;
}
