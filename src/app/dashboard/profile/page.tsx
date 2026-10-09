import React from 'react';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  Envelope,
  Phone,
  ShieldCheck,
  CheckCircle,
  FolderOpen,
  Receipt,
} from '@phosphor-icons/react/dist/ssr';

export const dynamic = 'force-dynamic';

export default async function CitizenProfilePage() {
  const user = await requireRole('CITIZEN');

  const [complaintCount, billCount] = await Promise.all([
    prisma.complaint.count({
      where: { citizenId: user.id },
    }),
    prisma.bill.count({
      where: { citizenId: user.id },
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div className="border-b border-[var(--border)] pb-5">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
          Account & Security
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--foreground)] tracking-tight mt-1">
          Citizen Profile
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Manage your verified civic identity, contact information, and service activity history.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center font-black text-2xl">
            {user.fullName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-[var(--foreground)]">{user.fullName}</h2>
              <span className="rounded bg-teal-100 text-teal-900 dark:bg-teal-950/60 dark:text-teal-200 px-2 py-0.5 text-[10px] font-black uppercase">
                Verified Citizen
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Bengaluru Ward Resident</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[var(--border)] text-xs">
          <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-[var(--surface-hover)]">
            <Envelope size={18} className="text-[var(--primary)]" />
            <div>
              <span className="text-[10px] text-[var(--text-muted)] block font-semibold">EMAIL</span>
              <span className="font-bold text-[var(--foreground)]">{user.email}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-[var(--surface-hover)]">
            <Phone size={18} className="text-[var(--primary)]" />
            <div>
              <span className="text-[10px] text-[var(--text-muted)] block font-semibold">PHONE</span>
              <span className="font-bold text-[var(--foreground)]">{user.phone || 'Not provided'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-[var(--surface-hover)]">
            <ShieldCheck size={18} className="text-[var(--primary)]" />
            <div>
              <span className="text-[10px] text-[var(--text-muted)] block font-semibold">ROLE</span>
              <span className="font-bold text-[var(--foreground)]">CITIZEN</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-[var(--surface-hover)]">
            <CheckCircle size={18} className="text-[var(--primary)]" />
            <div>
              <span className="text-[10px] text-[var(--text-muted)] block font-semibold">STATUS</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400">Active</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--border)]">
          <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)] mb-3">
            Civic Participation Summary
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-[var(--border)] p-4 text-center">
              <FolderOpen size={20} className="mx-auto text-[var(--primary)] mb-1" />
              <div className="text-2xl font-black text-[var(--foreground)]">{complaintCount}</div>
              <span className="text-[10px] font-bold text-[var(--text-muted)]">COMPLAINTS REPORTED</span>
            </div>
            <div className="rounded-xl border border-[var(--border)] p-4 text-center">
              <Receipt size={20} className="mx-auto text-[var(--primary)] mb-1" />
              <div className="text-2xl font-black text-[var(--foreground)]">{billCount}</div>
              <span className="text-[10px] font-bold text-[var(--text-muted)]">UTILITY BILLS MANAGED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
