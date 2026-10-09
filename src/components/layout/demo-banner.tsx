import React from 'react';
import { Role } from '@/types/enums';
import { Sparkle, SignOut } from '@phosphor-icons/react/dist/ssr';

interface DemoBannerProps {
  user: {
    fullName: string;
    email: string;
    role: Role;
    department?: { name: string; code: string } | null;
  };
}

export function DemoBanner({ user }: DemoBannerProps) {
  const roleBadges: Record<Role, { label: string; bg: string; text: string }> = {
    CITIZEN: { label: 'Citizen', bg: 'bg-teal-100 dark:bg-teal-900/60', text: 'text-teal-900 dark:text-teal-200' },
    ADMIN: { label: 'Administrator', bg: 'bg-cyan-100 dark:bg-cyan-900/60', text: 'text-cyan-900 dark:text-cyan-200' },
    WORKER: { label: `Worker (${user.department?.code || 'Field'})`, bg: 'bg-amber-100 dark:bg-amber-900/60', text: 'text-amber-900 dark:text-amber-200' },
  };

  const badge = roleBadges[user.role];

  return (
    <aside
      aria-label="Demo environment indicator"
      className="border-b border-amber-200 bg-amber-50/90 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200 px-4 py-2 text-xs"
    >
      <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkle size={14} weight="fill" className="text-amber-600 flex-shrink-0" />
          <span className="font-bold tracking-tight">DEMO ENVIRONMENT — SAMPLE DATA</span>
          <span className="hidden sm:inline text-amber-700 dark:text-amber-400">•</span>
          <span className="hidden sm:inline text-amber-800 dark:text-amber-300">
            Acting as: <strong className="font-semibold">{user.fullName}</strong>
          </span>
          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${badge.bg} ${badge.text}`}>
            {badge.label}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 font-bold hover:underline text-amber-900 dark:text-amber-200"
            >
              <SignOut size={14} weight="bold" />
              Sign Out / Switch Role
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
