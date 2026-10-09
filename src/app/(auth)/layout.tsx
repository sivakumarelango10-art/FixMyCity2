import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/brand/logo';
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[var(--surface)] via-[var(--background)] to-[var(--background)]">
      {/* Top minimal header */}
      <header className="px-6 py-6 flex items-center justify-between max-w-6xl mx-auto w-full">
        <Logo size="md" showTagline />
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
        >
          <ArrowLeft size={16} weight="bold" />
          Back to Portal Home
        </Link>
      </header>

      {/* Centered auth card container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 pb-12">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <footer className="py-4 text-center text-xs text-[var(--text-muted)] border-t border-[var(--border)]">
        FixMyCity Civic Services Platform • Secured via Supabase Auth
      </footer>
    </div>
  );
}
