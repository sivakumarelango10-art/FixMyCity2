import React from 'react';
import { requireRole } from '@/lib/auth';
import {
  ShieldCheck,
  Envelope,
  CheckCircle,
  Key,
} from '@phosphor-icons/react/dist/ssr';

export const dynamic = 'force-dynamic';

export default async function AdminAccountPage() {
  const user = await requireRole('ADMIN');

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="border-b border-[var(--border)] pb-5">
        <span className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-400">
          Executive Credentials
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--foreground)] tracking-tight mt-1">
          Administrator Account
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Root administrative officer profile with full operational and system configuration privileges.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-900 text-teal-100 flex items-center justify-center font-black text-2xl border border-teal-700">
            {user.fullName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-[var(--foreground)]">{user.fullName}</h2>
              <span className="rounded bg-teal-100 text-teal-900 dark:bg-teal-950/60 dark:text-teal-200 px-2 py-0.5 text-[10px] font-black uppercase">
                Administrator
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Municipal Operations Admin Console</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[var(--border)] text-xs">
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--surface-hover)]">
            <Envelope size={18} className="text-[var(--primary)]" />
            <div>
              <span className="text-[10px] text-[var(--text-muted)] block font-semibold">EMAIL</span>
              <span className="font-bold text-[var(--foreground)]">{user.email}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--surface-hover)]">
            <Key size={18} className="text-[var(--primary)]" />
            <div>
              <span className="text-[10px] text-[var(--text-muted)] block font-semibold">SYSTEM ROLE</span>
              <span className="font-bold text-[var(--foreground)]">ADMINISTRATOR (FULL_PRIVILEGES)</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--surface-hover)]">
            <ShieldCheck size={18} className="text-[var(--primary)]" />
            <div>
              <span className="text-[10px] text-[var(--text-muted)] block font-semibold">ACCESS SCOPE</span>
              <span className="font-bold text-[var(--foreground)]">All Municipal Departments & Finances</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--surface-hover)]">
            <CheckCircle size={18} className="text-[var(--primary)]" />
            <div>
              <span className="text-[10px] text-[var(--text-muted)] block font-semibold">ACCOUNT STATUS</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
