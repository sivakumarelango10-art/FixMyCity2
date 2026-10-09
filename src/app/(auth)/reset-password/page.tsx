'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { Lock, Eye, EyeSlash, CheckCircle, Key } from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isPending, startTransition] = useTransition();

  const supabase = createSupabaseBrowserClient();

  const handleUpdatePassword = async (e: React.FormEvent) => {
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
        const { error } = await supabase.auth.updateUser({
          password,
        });

        if (error) {
          setErrorMsg(error.message);
          return;
        }

        toast.success('Password updated successfully!');
        router.push('/auth/redirect');
        router.refresh();
      } catch {
        setErrorMsg('Failed to update password. Recovery link may have expired.');
      }
    });
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-sm">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center mx-auto mb-3">
          <Key size={26} weight="duotone" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-[var(--foreground)]">
          Set New Password
        </h1>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Enter and confirm your new secure password
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

      <form onSubmit={handleUpdatePassword} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-xs font-bold text-[var(--foreground)] mb-1.5">
            New Password (min 8 chars, letters & numbers)
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
            Confirm New Password
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
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-[var(--primary-hover)] focus-visible:outline-2 transition-all disabled:opacity-50"
        >
          <CheckCircle size={18} weight="bold" />
          {isPending ? 'Updating Password...' : 'Save New Password'}
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-[var(--text-secondary)]">
        <Link href="/login" className="font-bold text-[var(--primary)] hover:underline">
          Cancel and return to sign in
        </Link>
      </div>
    </div>
  );
}
