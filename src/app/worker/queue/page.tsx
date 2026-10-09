import React from 'react';
import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  Tray,
  MapPin,
  Clock,
  ArrowRight,
} from '@phosphor-icons/react/dist/ssr';
import { ClaimButton } from './claim-button';

export const dynamic = 'force-dynamic';

export default async function WorkerQueuePage() {
  const worker = await requireRole('WORKER');

  const departmentId = worker.departmentId;

  const queueItems = departmentId
    ? await prisma.complaint.findMany({
        where: {
          departmentId,
          assignedWorkerId: null,
          status: { in: ['ASSIGNED', 'REOPENED'] },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        include: {
          citizen: { select: { fullName: true } },
          department: true,
        },
      })
    : [];

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="border-b border-[var(--border)] pb-5">
        <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
          Ward Queue • {worker.department?.name || 'Department'}
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--foreground)] tracking-tight mt-1">
          Department Queue ({queueItems.length})
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Unclaimed civic complaints assigned to your department. Active field workers can claim tasks directly.
        </p>
      </div>

      <div className="space-y-3">
        {queueItems.map((item) => (
          <div
            key={item.id}
            data-testid={`queue-item-${item.id}`}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs hover:border-[var(--primary)] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-[var(--primary)]">
                  {item.trackingNumber}
                </span>
                <span className="rounded bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 px-2 py-0.5 text-[10px] font-black uppercase">
                  Unclaimed
                </span>
                <span className="rounded bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 text-[10px] font-black uppercase">
                  {item.priority}
                </span>
                <span className="rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 text-[10px] font-bold">
                  {item.category.replace('_', ' ')}
                </span>
              </div>

              <h3 className="text-base font-bold text-[var(--foreground)]">{item.title}</h3>

              <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-1">
                  <MapPin size={14} /> {item.address}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={14} /> Assigned{' '}
                  {new Date(item.updatedAt).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/worker/tasks/${item.id}`}
                className="inline-flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--foreground)] px-3 py-2 text-xs font-bold transition-all"
              >
                Inspect
                <ArrowRight size={12} weight="bold" />
              </Link>
              <ClaimButton complaintId={item.id} />
            </div>
          </div>
        ))}

        {queueItems.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[var(--border)] p-12 text-center">
            <Tray size={32} className="mx-auto text-[var(--text-muted)] mb-2" />
            <p className="text-xs text-[var(--text-muted)]">
              No unclaimed complaints in your department queue right now. Great job keeping up with field work!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
