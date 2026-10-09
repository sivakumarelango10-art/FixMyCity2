import React from 'react';
import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  Wrench,
  Tray,
  HourglassHigh,
  ArrowRight,
  MapPin,
} from '@phosphor-icons/react/dist/ssr';

export default async function WorkerOverviewPage() {
  const user = await requireRole('WORKER');

  // Load department and tasks specifically scoped to worker's department
  const departmentId = user.departmentId;

  const [myAssignedTasks, departmentQueue, inProgressTasks, _resolvedHistory] = await Promise.all([
    // Work assigned specifically to this worker
    prisma.complaint.findMany({
      where: {
        assignedWorkerId: user.id,
        status: { in: ['ASSIGNED', 'IN_PROGRESS', 'REOPENED'] },
      },
      orderBy: { createdAt: 'desc' },
      include: { department: true, citizen: true },
    }),
    // Work in department queue not yet claimed by any worker
    departmentId
      ? prisma.complaint.findMany({
          where: {
            departmentId,
            assignedWorkerId: null,
            status: { in: ['ASSIGNED', 'REOPENED'] },
          },
          orderBy: { createdAt: 'desc' },
          include: { department: true, citizen: true },
        })
      : Promise.resolve([]),
    // In progress tasks
    prisma.complaint.count({
      where: {
        assignedWorkerId: user.id,
        status: 'IN_PROGRESS',
      },
    }),
    // Recently resolved tasks
    departmentId
      ? prisma.complaint.findMany({
          where: {
            departmentId,
            status: 'RESOLVED',
          },
          take: 4,
          orderBy: { resolvedAt: 'desc' },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
            Field Operations Console
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--foreground)] tracking-tight">
            {user.fullName}
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Department: <strong>{user.department?.name || 'Unassigned'}</strong> • Ward Field Queue
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/worker/my-tasks"
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all"
          >
            <Wrench size={16} weight="bold" />
            My Active Tasks ({myAssignedTasks.length})
          </Link>
          <Link
            href="/worker/queue"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-xs font-bold text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-all"
          >
            <Tray size={16} weight="bold" />
            Claim Queue ({departmentQueue.length})
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)]">
            <span>MY ASSIGNED TASKS</span>
            <Wrench size={18} className="text-amber-600" />
          </div>
          <div className="mt-2 text-3xl font-black text-[var(--foreground)]">
            {myAssignedTasks.length}
          </div>
          <Link
            href="/worker/my-tasks"
            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:underline"
          >
            Go to my tasks <ArrowRight size={12} weight="bold" />
          </Link>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)]">
            <span>UNCLAIMED DEPT QUEUE</span>
            <Tray size={18} className="text-indigo-600" />
          </div>
          <div className="mt-2 text-3xl font-black text-[var(--foreground)]">
            {departmentQueue.length}
          </div>
          <Link
            href="/worker/queue"
            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:underline"
          >
            Inspect queue <ArrowRight size={12} weight="bold" />
          </Link>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)]">
            <span>IN PROGRESS</span>
            <HourglassHigh size={18} className="text-cyan-600" />
          </div>
          <div className="mt-2 text-3xl font-black text-[var(--foreground)]">
            {inProgressTasks}
          </div>
          <span className="mt-3 text-xs text-[var(--text-muted)] block">Active on-site tasks</span>
        </div>
      </div>

      {/* Two columns: My Tasks vs Department Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* My Tasks */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[var(--foreground)]">
              Directly Assigned to Me
            </h2>
            <Link
              href="/worker/my-tasks"
              className="text-xs font-bold text-amber-700 hover:underline"
            >
              See all
            </Link>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs">
            {myAssignedTasks.length === 0 ? (
              <p className="p-6 text-center text-xs text-[var(--text-muted)]">
                No active complaints directly assigned to you currently.
              </p>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {myAssignedTasks.map((t) => (
                  <div key={t.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[var(--primary)]">
                        {t.trackingNumber}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800">
                        {t.priority}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-[var(--foreground)] mt-1">{t.title}</h4>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5 flex items-center gap-1">
                      <MapPin size={12} /> {t.address}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                        Status: {t.status}
                      </span>
                      <Link
                        href={`/worker/tasks/${t.id}`}
                        className="font-bold text-amber-700 hover:underline inline-flex items-center gap-1"
                      >
                        Action Task <ArrowRight size={12} weight="bold" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Claimable Department Queue */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[var(--foreground)]">
              Available to Claim ({user.department?.code})
            </h2>
            <Link
              href="/worker/queue"
              className="text-xs font-bold text-amber-700 hover:underline"
            >
              All unclaimed
            </Link>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs">
            {departmentQueue.length === 0 ? (
              <p className="p-6 text-center text-xs text-[var(--text-muted)]">
                No unclaimed items in your department queue.
              </p>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {departmentQueue.map((q) => (
                  <div key={q.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[var(--primary)]">
                        {q.trackingNumber}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800">
                        Unclaimed
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-[var(--foreground)] mt-1">{q.title}</h4>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{q.address}</p>
                    <div className="mt-2 flex items-center justify-end">
                      <Link
                        href={`/worker/tasks/${q.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-amber-700 px-3 py-1 text-xs font-bold text-white hover:bg-amber-800 transition-colors"
                      >
                        Claim Task
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
