'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import {
  Lock,
  Envelope,
  Eye,
  EyeSlash,
  SignIn,
  Sparkle,
  ArrowRight,
  ShieldCheck,
  User,
  Wrench,
} from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isPending, startTransition] = useTransition();
  const [demoRoleLoading, setDemoRoleLoading] = useState<string | null>(null);

  const supabase = createSupabaseBrowserClient();

  // Map known error messages
  function mapAuthError(rawMsg: string): string {
    const lower = rawMsg.toLowerCase();
    if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
      return 'Email or password is incorrect.';
    }
    if (lower.includes('email not confirmed')) {
      return 'Please confirm your email first.';
    }
    if (lower.includes('rate limit') || lower.includes('too many')) {
      return 'Too many attempts. Try again shortly.';
    }
    if (lower.includes('network') || lower.includes('fetch')) {
      return 'Unable to reach the server.';
    }
    return rawMsg;
  }

  // Handle Email + Password Sign In
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    startTransition(async () => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setErrorMsg(mapAuthError(error.message));
          return;
        }

        if (data.user) {
          toast.success('Signed in successfully.');
          router.push(next ? `/auth/redirect?next=${encodeURIComponent(next)}` : '/auth/redirect');
          router.refresh();
        }
      } catch {
        setErrorMsg('An unexpected connection error occurred.');
      }
    });
  };

  // Handle Google OAuth
  const handleGoogleLogin = async () => {
    setErrorMsg('');
    try {
      const siteUrl = window.location.origin;
      const callbackUrl = `${siteUrl}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ''}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
        },
      });

      if (error) {
        setErrorMsg(mapAuthError(error.message));
      }
    } catch {
      setErrorMsg('Unable to initiate Google sign-in.');
    }
  };

  // Handle One-Click Demo Login
  const handleDemoLogin = async (role: 'CITIZEN' | 'ADMIN' | 'WORKER') => {
    setDemoRoleLoading(role);
    setErrorMsg('');

    try {
      const res = await fetch('/api/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Demo login failed');
        toast.error(data.error || 'Demo login failed');
        setDemoRoleLoading(null);
        return;
      }

      toast.success(`Logged in as ${role} Demo! Redirecting...`);
      router.push(data.redirectTo || '/dashboard');
      router.refresh();
    } catch {
      setErrorMsg('Network error connecting to demo login endpoint.');
      setDemoRoleLoading(null);
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-sm">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-black tracking-tight text-[var(--foreground)]">
          Welcome to FixMyCity
        </h1>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Sign in to report civic problems or access municipal services
        </p>
      </div>

      {/* Error Notice */}
      {errorMsg && (
        <div
          role="alert"
          data-testid="error-alert"
          className="mb-5 rounded-xl bg-[var(--error-light)] p-3 text-xs font-semibold text-[var(--error)] border border-[var(--error)]/20"
        >
          {errorMsg}
        </div>
      )}

      {/* Google Sign In */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isPending || !!demoRoleLoading}
        className="w-full flex items-center justify-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface-hover)] focus-visible:outline-2 transition-all disabled:opacity-50 shadow-xs"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        Continue with Google
      </button>

      <div className="relative my-6 text-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border)]" />
        </div>
        <span className="relative bg-[var(--surface)] px-3 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
          Or continue with email
        </span>
      </div>

      {/* Email / Password Form */}
      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-xs font-bold text-[var(--foreground)] mb-1.5">
            Email address
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--text-muted)] pointer-events-none">
              <Envelope size={18} />
            </span>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] py-2.5 pl-9 pr-3 text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-xs font-bold text-[var(--foreground)]">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-[var(--primary)] hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--text-muted)] pointer-events-none">
              <Lock size={18} />
            </span>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] py-2.5 pl-9 pr-10 text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending || !!demoRoleLoading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-[var(--primary-hover)] focus-visible:outline-2 transition-all disabled:opacity-50"
        >
          <SignIn size={18} weight="bold" />
          {isPending ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-[var(--text-secondary)]">
        Do not have an account?{' '}
        <Link href="/register" className="font-bold text-[var(--primary)] hover:underline">
          Create citizen account
        </Link>
      </div>

      {/* One-Click Showcase Demo Login */}
      <div className="mt-8 pt-6 border-t border-dashed border-[var(--border)]">
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[var(--primary)]">
            <Sparkle size={14} weight="fill" className="text-amber-500" />
            Try a Demo Portal (One-Click)
          </span>
          <span className="text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded">
            Pre-seeded
          </span>
        </div>

        <p className="text-xs text-[var(--text-secondary)] mb-3 leading-relaxed">
          Explore role-specific experiences without manual registration. Click below to launch:
        </p>

        <div className="grid grid-cols-1 gap-2">
          <button
            type="button"
            onClick={() => handleDemoLogin('CITIZEN')}
            disabled={isPending || !!demoRoleLoading}
            className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-xs font-bold text-[var(--foreground)] hover:border-[var(--primary)] hover:bg-[var(--primary-light)]/20 transition-all text-left disabled:opacity-50"
          >
            <span className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
                <User size={16} weight="bold" />
              </span>
              <span>
                <span className="block font-bold">Try Citizen Demo</span>
                <span className="text-[10px] text-[var(--text-muted)] font-normal">Report complaints, bills, tracking</span>
              </span>
            </span>
            <span className="text-[var(--primary)] font-bold text-xs flex items-center gap-1">
              {demoRoleLoading === 'CITIZEN' ? 'Entering...' : <>Launch <ArrowRight size={12} weight="bold" /></>}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleDemoLogin('ADMIN')}
            disabled={isPending || !!demoRoleLoading}
            className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-xs font-bold text-[var(--foreground)] hover:border-[#008C9A] hover:bg-[#008C9A]/10 transition-all text-left disabled:opacity-50"
          >
            <span className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-cyan-100 text-cyan-800 flex items-center justify-center">
                <ShieldCheck size={16} weight="bold" />
              </span>
              <span>
                <span className="block font-bold">Try Admin Demo</span>
                <span className="text-[10px] text-[var(--text-muted)] font-normal">Triage, allocate, billing settings</span>
              </span>
            </span>
            <span className="text-[#008C9A] font-bold text-xs flex items-center gap-1">
              {demoRoleLoading === 'ADMIN' ? 'Entering...' : <>Launch <ArrowRight size={12} weight="bold" /></>}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleDemoLogin('WORKER')}
            disabled={isPending || !!demoRoleLoading}
            className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-xs font-bold text-[var(--foreground)] hover:border-[#A35F00] hover:bg-[#A35F00]/10 transition-all text-left disabled:opacity-50"
          >
            <span className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                <Wrench size={16} weight="bold" />
              </span>
              <span>
                <span className="block font-bold">Try Worker Demo</span>
                <span className="text-[10px] text-[var(--text-muted)] font-normal">Department queue, resolution workflow</span>
              </span>
            </span>
            <span className="text-[#A35F00] font-bold text-xs flex items-center gap-1">
              {demoRoleLoading === 'WORKER' ? 'Entering...' : <>Launch <ArrowRight size={12} weight="bold" /></>}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
