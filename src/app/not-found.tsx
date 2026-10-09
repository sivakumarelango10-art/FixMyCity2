import React from 'react';
import Link from 'next/link';
import { HouseLine, Question } from '@phosphor-icons/react/dist/ssr';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--primary-light)] text-[var(--primary)]">
        <Question size={36} weight="duotone" />
      </div>
      <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
        404 — Page Not Found
      </h1>
      <p className="mb-6 max-w-md text-sm text-[var(--text-secondary)]">
        The civic page or service you are searching for does not exist or has been moved to a new address.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--primary-hover)] transition-colors"
      >
        <HouseLine size={18} weight="bold" />
        Return to Home
      </Link>
    </div>
  );
}
