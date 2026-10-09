import React from 'react';
import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  CheckCircle,
  MapPin,
  Clock,
  ArrowRight,
  ChatCircleText,
} from '@phosphor-icons/react/dist/ssr';

export const dynamic = 'force-dynamic';

export default async function WorkerHistoryPage() {
  const worker = await requireRole('WORKER');

  const departmentId = worker.departmentId;

  const resolvedTasks = departmentId
    ? await prisma.complaint.findMany({
        where: {
          departmentId,
          status: 'RESOLVED',
        },
        orderBy: { resolvedAt: 'desc' },
        take: 50,
        include: {
          citizen: { select: { fullName: true } },
          assignedWorker: { select: { fullName: true, id: true } },
        },
      })
    : [];

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="border-b border-[var(--border)] pb-5">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
          Ward Archive • {worker.department?.name || 'Department'}
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--foreground)] tracking-tight mt-1">
          Resolved History ({resolvedTasks.length})
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Historical archive of resolved civic issues in your ward jurisdiction with on-site resolution summaries.
        </p>
      </div>

      <div className="space-y-3">
        {resolvedTasks.map((task) => (
          <div
            key={task.id}
            data-testid={`resolved-task-${task.id}`}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs flex flex-col sm:flex-row sm:items-start justify-between gap-4"
          >
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-[var(--primary)]">
                  {task.trackingNumber}
                </span>
                <span className="flex items-center gap-1 rounded bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-black uppercase">
                  <CheckCircle size={12} weight="fill" /> RESOLVED
                </span>
                <span className="rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 text-[10px] font-bold">
                  {task.category.replace('_', ' ')}
                </span>
              </div>

              <h3 className="text-base font-bold text-[var(--foreground)]">{task.title}</h3>

              {task.resolutionSummary && (
                <div className="rounded-xl bg-[var(--surface-hover)] p-3 text-xs text-[var(--text-secondary)] flex items-start gap-2">
                  <ChatCircleText size={16} className="text-[var(--primary)] flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-[11px] text-[var(--foreground)]">Resolution Summary:</strong>
                    <span>{task.resolutionSummary}</span>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)] pt-1">
                <span className="flex items-center gap-1">
                  <MapPin size={14} /> {task.address}
                </span>
                {task.resolvedAt && (
                  <span className="flex items-center gap-1">
                    <Clock size={14} /> Resolved on{' '}
                    {new Date(task.resolvedAt).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                )}
                {task.assignedWorker && (
                  <span className="text-amber-800 dark:text-amber-300 font-semibold">
                    Officer: {task.assignedWorker.fullName}
                  </span>
                )}
              </div>
            </div>

            <Link
              href={`/worker/tasks/${task.id}`}
              className="inline-flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--foreground)] px-3 py-2 text-xs font-bold transition-all"
            >
              View Record
              <ArrowRight size={12} weight="bold" />
            </Link>
          </div>
        ))}

        {resolvedTasks.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[var(--border)] p-12 text-center">
            <CheckCircle size={32} className="mx-auto text-[var(--text-muted)] mb-2" />
            <p className="text-xs text-[var(--text-muted)]">
              No resolved complaints recorded in your department yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
