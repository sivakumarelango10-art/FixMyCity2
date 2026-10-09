import React from 'react';
import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  HourglassHigh,
  ArrowRight,
  MapPin,
  Clock,
  Wrench,
} from '@phosphor-icons/react/dist/ssr';

export const dynamic = 'force-dynamic';

export default async function WorkerInProgressPage() {
  const worker = await requireRole('WORKER');

  const tasks = await prisma.complaint.findMany({
    where: {
      assignedWorkerId: worker.id,
      status: 'IN_PROGRESS',
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      citizen: { select: { fullName: true } },
      department: true,
    },
  });

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="border-b border-[var(--border)] pb-5">
        <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
          Field Execution
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--foreground)] tracking-tight mt-1">
          In-Progress Complaints ({tasks.length})
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Complaints currently being actively repaired or investigated on-site by you.
        </p>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            data-testid={`in-progress-task-${task.id}`}
            className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-[var(--surface)] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-[var(--primary)]">
                  {task.trackingNumber}
                </span>
                <span className="rounded bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 px-2 py-0.5 text-[10px] font-black uppercase">
                  ACTIVE ON SITE
                </span>
                <span className="rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 text-[10px] font-bold">
                  {task.priority} Priority
                </span>
              </div>

              <h3 className="text-base font-bold text-[var(--foreground)]">{task.title}</h3>

              <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-1">
                  <MapPin size={14} /> {task.address}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={14} /> Updated{' '}
                  {new Date(task.updatedAt).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>

            <Link
              href={`/worker/tasks/${task.id}`}
              className="inline-flex items-center gap-1 rounded-xl bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 text-xs font-bold transition-all shadow-xs"
            >
              <Wrench size={14} weight="bold" />
              Update / Resolve
              <ArrowRight size={14} weight="bold" />
            </Link>
          </div>
        ))}

        {tasks.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[var(--border)] p-12 text-center">
            <HourglassHigh size={32} className="mx-auto text-[var(--text-muted)] mb-2" />
            <p className="text-xs text-[var(--text-muted)]">
              No tasks currently marked as in-progress. Start work from your assigned tasks list.
            </p>
            <Link
              href="/worker/my-tasks"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:underline"
            >
              View Assigned Tasks <ArrowRight size={12} weight="bold" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
