'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { Envelope, ArrowLeft, PaperPlaneTilt, CheckCircle } from '@phosphor-icons/react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isPending, startTransition] = useTransition();

  const supabase = createSupabaseBrowserClient();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    startTransition(async () => {
      try {
        const siteUrl = window.location.origin;
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${siteUrl}/auth/confirm?type=recovery`,
        });

        if (error) {
          setErrorMsg(error.message);
          return;
        }

        setSubmitted(true);
      } catch {
        setErrorMsg('Unable to send password recovery request. Please try again.');
      }
    });
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-sm text-center">
        <div className="w-14 h-14 rounded-2xl bg-[var(--success-light)] text-[var(--success)] flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} weight="fill" />
        </div>
        <h2 className="text-2xl font-black text-[var(--foreground)] mb-2">Check Your Inbox</h2>
        <p className="text-xs text-[var(--text-secondary)] mb-6 leading-relaxed">
          If an account exists with <strong className="text-[var(--foreground)]">{email}</strong>, a password reset link has been dispatched. Please check your email inbox and spam folder.
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
          Reset Your Password
        </h1>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Enter your registered email address to receive password recovery instructions
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

      <form onSubmit={handleReset} className="space-y-4">
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

        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-[var(--primary-hover)] focus-visible:outline-2 transition-all disabled:opacity-50"
        >
          <PaperPlaneTilt size={18} weight="bold" />
          {isPending ? 'Sending Link...' : 'Send Recovery Link'}
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-[var(--text-secondary)]">
        <Link href="/login" className="inline-flex items-center gap-1 font-bold text-[var(--primary)] hover:underline">
          <ArrowLeft size={14} weight="bold" /> Back to Sign In
        </Link>
      </div>
    </div>
  );
}
