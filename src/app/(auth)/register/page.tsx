'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import {
  User,
  Envelope,
  Lock,
  Eye,
  EyeSlash,
  UserPlus,
  CheckCircle,
} from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successEmailSent, setSuccessEmailSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  const supabase = createSupabaseBrowserClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setErrorMsg('Password must include both letters and numbers.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    startTransition(async () => {
      try {
        const siteUrl = window.location.origin;
        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              phone: phone.trim() || undefined,
            },
            emailRedirectTo: `${siteUrl}/auth/callback`,
          },
        });

        if (error) {
          setErrorMsg(error.message);
          return;
        }

        // If Supabase requires email verification
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          setErrorMsg('An account with this email already exists.');
          return;
        }

        if (data.session) {
          toast.success('Registration successful! Welcome to FixMyCity.');
          router.push('/dashboard');
          router.refresh();
        } else {
          setSuccessEmailSent(true);
        }
      } catch {
        setErrorMsg('An error occurred during registration. Please try again.');
      }
    });
  };

  if (successEmailSent) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-sm text-center">
        <div className="w-14 h-14 rounded-2xl bg-[var(--success-light)] text-[var(--success)] flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} weight="fill" />
        </div>
        <h2 className="text-2xl font-black text-[var(--foreground)] mb-2">Check Your Email</h2>
        <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">
          We have sent a verification link to <strong className="text-[var(--foreground)]">{email}</strong>. Click the link in the message to activate your citizen account.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[var(--primary-hover)] transition-colors"
        >
          Return to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-sm">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-black tracking-tight text-[var(--foreground)]">
          Create Citizen Account
        </h1>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Join FixMyCity to report issues and track municipal resolutions
        </p>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="mb-5 rounded-xl bg-[var(--error-light)] p-3 text-xs font-semibold text-[var(--error)] border border-[var(--error)]/20"
        >
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label htmlFor="fullName" className="block text-xs font-bold text-[var(--foreground)] mb-1.5">
            Full Name
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--text-muted)] pointer-events-none">
              <User size={18} />
            </span>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Anand Sharma"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] py-2.5 pl-9 pr-3 text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none transition-colors"
            />
          </div>
        </div>

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
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] py-2.5 pl-9 pr-3 text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div>
          <label htmlFor="phone" className="block text-xs font-bold text-[var(--foreground)] mb-1.5">
            Mobile Number (Optional)
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] py-2.5 px-3 text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-bold text-[var(--foreground)] mb-1.5">
            Password (min 8 characters with letters & numbers)
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--text-muted)] pointer-events-none">
              <Lock size={18} />
            </span>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
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

        <div>
          <label htmlFor="confirmPassword" className="block text-xs font-bold text-[var(--foreground)] mb-1.5">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] py-2.5 px-3 text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-[var(--primary-hover)] focus-visible:outline-2 transition-all disabled:opacity-50 mt-2"
        >
          <UserPlus size={18} weight="bold" />
          {isPending ? 'Creating Account...' : 'Register as Citizen'}
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-[var(--text-secondary)]">
        Already have an account?{' '}
        <Link href="/login" className="font-bold text-[var(--primary)] hover:underline">
          Sign in here
        </Link>
      </div>
    </div>
  );
}
