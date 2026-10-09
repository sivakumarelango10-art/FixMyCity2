'use client';

import React, { useEffect } from 'react';
import { ArrowClockwise, WarningCircle } from '@phosphor-icons/react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error securely without exposing PII
    console.error('App runtime error caught by error boundary:', error.message);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--error-light)] text-[var(--error)]">
        <WarningCircle size={36} weight="duotone" />
      </div>
      <h2 className="mb-2 text-2xl font-bold tracking-tight text-[var(--foreground)]">
        Something went wrong
      </h2>
      <p className="mb-6 max-w-md text-sm text-[var(--text-secondary)]">
        We encountered an unexpected error. Please try refreshing the page or try again in a few moments.
      </p>
      <button
        onClick={() => reset()}
        className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors"
      >
        <ArrowClockwise size={18} weight="bold" />
        Try Again
      </button>
    </div>
  );
}
