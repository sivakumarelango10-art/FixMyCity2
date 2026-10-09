import React from 'react';
import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  Wrench,
  ArrowRight,
  MapPin,
  Clock,
} from '@phosphor-icons/react/dist/ssr';

export const dynamic = 'force-dynamic';

export default async function WorkerMyTasksPage() {
  const worker = await requireRole('WORKER');

  const tasks = await prisma.complaint.findMany({
    where: {
      assignedWorkerId: worker.id,
      status: { in: ['ASSIGNED', 'IN_PROGRESS', 'REOPENED'] },
    },
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    include: {
      citizen: { select: { fullName: true } },
      department: true,
    },
  });

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="border-b border-[var(--border)] pb-5">
        <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
          Field Operations
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--foreground)] tracking-tight mt-1">
          My Assigned Tasks ({tasks.length})
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Civic complaints assigned directly to you for field investigation and resolution.
        </p>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            data-testid={`worker-task-${task.id}`}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs hover:border-[var(--primary)] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-[var(--primary)]">
                  {task.trackingNumber}
                </span>
                <span className="rounded bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 text-[10px] font-black uppercase">
                  {task.priority} Priority
                </span>
                <span className="rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 text-[10px] font-bold">
                  {task.status.replace('_', ' ')}
                </span>
              </div>

              <h3 className="text-base font-bold text-[var(--foreground)]">{task.title}</h3>

              <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-1">
                  <MapPin size={14} /> {task.address}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={14} /> Reported{' '}
                  {new Date(task.createdAt).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/worker/tasks/${task.id}`}
                className="inline-flex items-center gap-1 rounded-xl bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 text-xs font-bold transition-all shadow-xs"
              >
                <Wrench size={14} weight="bold" />
                Action Task
                <ArrowRight size={14} weight="bold" />
              </Link>
            </div>
          </div>
        ))}

        {tasks.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[var(--border)] p-12 text-center">
            <p className="text-xs text-[var(--text-muted)]">
              You do not have any active tasks directly assigned right now. Check the Department Queue to claim unassigned tasks.
            </p>
            <Link
              href="/worker/queue"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:underline"
            >
              Browse Department Queue <ArrowRight size={12} weight="bold" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
