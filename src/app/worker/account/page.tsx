import React from 'react';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  Wrench,
  Buildings,
  Envelope,
  Phone,
  ShieldCheck,
  CheckCircle,
} from '@phosphor-icons/react/dist/ssr';

export const dynamic = 'force-dynamic';

export default async function WorkerAccountPage() {
  const user = await requireRole('WORKER');

  const [activeTasksCount, resolvedTasksCount] = await Promise.all([
    prisma.complaint.count({
      where: {
        assignedWorkerId: user.id,
        status: { in: ['ASSIGNED', 'IN_PROGRESS', 'REOPENED'] },
      },
    }),
    prisma.complaint.count({
      where: {
        assignedWorkerId: user.id,
        status: 'RESOLVED',
      },
    }),
  ]);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="border-b border-[var(--border)] pb-5">
        <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
          Field Officer Credentials
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--foreground)] tracking-tight mt-1">
          Worker Profile & Operations
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Your municipal service ID, ward department jurisdiction, and operational activity record.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-950/80 text-amber-200 border border-amber-800 flex items-center justify-center font-black text-2xl">
            {user.fullName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-[var(--foreground)]">{user.fullName}</h2>
              <span className="rounded bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 px-2 py-0.5 text-[10px] font-black uppercase">
                Field Worker
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Municipal Field Operations Staff</p>
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
            <Buildings size={18} className="text-[var(--primary)]" />
            <div>
              <span className="text-[10px] text-[var(--text-muted)] block font-semibold">DEPARTMENT</span>
              <span className="font-bold text-[var(--foreground)]">
                {user.department?.name || 'Unassigned'} ({user.department?.code || 'N/A'})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--surface-hover)]">
            <Phone size={18} className="text-[var(--primary)]" />
            <div>
              <span className="text-[10px] text-[var(--text-muted)] block font-semibold">CONTACT PHONE</span>
              <span className="font-bold text-[var(--foreground)]">{user.phone || 'Not configured'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--surface-hover)]">
            <ShieldCheck size={18} className="text-[var(--primary)]" />
            <div>
              <span className="text-[10px] text-[var(--text-muted)] block font-semibold">ACCOUNT STATUS</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle size={14} weight="fill" /> Active & Operational
              </span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--border)]">
          <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)] mb-3">
            Performance & Workload Summary
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-[var(--border)] p-4 text-center">
              <Wrench size={20} className="mx-auto text-amber-600 mb-1" />
              <div className="text-2xl font-black text-[var(--foreground)]">{activeTasksCount}</div>
              <span className="text-[10px] font-bold text-[var(--text-muted)]">ACTIVE COMPLAINTS</span>
            </div>
            <div className="rounded-xl border border-[var(--border)] p-4 text-center">
              <CheckCircle size={20} className="mx-auto text-emerald-600 mb-1" />
              <div className="text-2xl font-black text-[var(--foreground)]">{resolvedTasksCount}</div>
              <span className="text-[10px] font-bold text-[var(--text-muted)]">RESOLVED TO DATE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
