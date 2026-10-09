import React from 'react';

export default function GlobalLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-4 flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#DCE4E2] border-t-[#176B68]" />
      </div>
      <p className="text-sm font-medium text-[var(--text-secondary)] animate-pulse">
        Loading FixMyCity...
      </p>
    </div>
  );
}
