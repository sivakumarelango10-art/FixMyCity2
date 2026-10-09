import React from 'react';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  ChartBar,
  Clock,
  CheckCircle,
  FolderOpen,
  WarningCircle,
} from '@phosphor-icons/react/dist/ssr';

export const dynamic = 'force-dynamic';

export default async function AdminAnalyticsPage() {
  await requireRole('ADMIN');

  // Load real aggregate data
  const [
    totalComplaints,
    statusCounts,
    priorityCounts,
    departmentCounts,
    resolvedComplaints,
  ] = await Promise.all([
    prisma.complaint.count(),
    prisma.complaint.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
    prisma.complaint.groupBy({
      by: ['priority'],
      _count: { id: true },
    }),
    prisma.department.findMany({
      include: {
        _count: {
          select: { complaints: true, profiles: true },
        },
      },
    }),
    prisma.complaint.findMany({
      where: {
        status: 'RESOLVED',
        resolvedAt: { not: null },
      },
      select: {
        createdAt: true,
        resolvedAt: true,
      },
    }),
  ]);

  // Calculate Average Resolution Time
  let avgResolutionHours: number | null = null;
  if (resolvedComplaints.length >= 3) {
    const totalMs = resolvedComplaints.reduce((acc, c) => {
      const diff = new Date(c.resolvedAt!).getTime() - new Date(c.createdAt).getTime();
      return acc + diff;
    }, 0);
    avgResolutionHours = Math.round(totalMs / resolvedComplaints.length / (1000 * 60 * 60));
  }

  const statusMap = Object.fromEntries(statusCounts.map((s) => [s.status, s._count.id]));
  const priorityMap = Object.fromEntries(priorityCounts.map((p) => [p.priority, p._count.id]));

  return (
    <div className="space-y-8 max-w-7xl">
      <div className="border-b border-[var(--border)] pb-5">
        <span className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-400">
          Executive Telemetry
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--foreground)] tracking-tight mt-1">
          Civic Services Analytics & Workload
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Verified database aggregates, department resolution distribution, and civic pipeline performance.
        </p>
      </div>

      {/* Top Aggregate Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)]">
            <span>TOTAL COMPLAINTS</span>
            <FolderOpen size={18} className="text-teal-600" />
          </div>
          <div className="mt-2 text-3xl font-black text-[var(--foreground)]">{totalComplaints}</div>
          <span className="text-[11px] text-[var(--text-muted)] mt-1 block">All recorded issues</span>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)]">
            <span>RESOLVED ISSUES</span>
            <CheckCircle size={18} className="text-emerald-600" />
          </div>
          <div className="mt-2 text-3xl font-black text-emerald-700 dark:text-emerald-400">
            {statusMap['RESOLVED'] || 0}
          </div>
          <span className="text-[11px] text-[var(--text-muted)] mt-1 block">
            {totalComplaints > 0
              ? `${Math.round(((statusMap['RESOLVED'] || 0) / totalComplaints) * 100)}% resolution rate`
              : 'No complaints'}
          </span>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)]">
            <span>HIGH & CRITICAL</span>
            <WarningCircle size={18} className="text-rose-600" />
          </div>
          <div className="mt-2 text-3xl font-black text-rose-700 dark:text-rose-400">
            {(priorityMap['HIGH'] || 0) + (priorityMap['CRITICAL'] || 0)}
          </div>
          <span className="text-[11px] text-[var(--text-muted)] mt-1 block">High urgency queue</span>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)]">
            <span>AVG RESOLUTION TIME</span>
            <Clock size={18} className="text-cyan-600" />
          </div>
          <div className="mt-2 text-3xl font-black text-[var(--foreground)]">
            {avgResolutionHours !== null ? `${avgResolutionHours}h` : 'N/A'}
          </div>
          <span className="text-[11px] text-[var(--text-muted)] mt-1 block">
            {resolvedComplaints.length >= 3
              ? `Based on ${resolvedComplaints.length} completed cases`
              : 'Requires >= 3 resolved complaints'}
          </span>
        </div>
      </div>

      {/* Two Column Layout: Status Breakdown and Department Workloads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Status Pipeline Table */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4 shadow-xs">
          <h2 className="text-base font-extrabold text-[var(--foreground)] flex items-center gap-2">
            <ChartBar size={18} className="text-[var(--primary)]" />
            Complaint Pipeline Status
          </h2>

          <div className="space-y-3">
            {[
              { label: 'Submitted', count: statusMap['SUBMITTED'] || 0, bg: 'bg-blue-500' },
              { label: 'Under Review', count: statusMap['UNDER_REVIEW'] || 0, bg: 'bg-indigo-500' },
              { label: 'Assigned', count: statusMap['ASSIGNED'] || 0, bg: 'bg-amber-500' },
              { label: 'In Progress', count: statusMap['IN_PROGRESS'] || 0, bg: 'bg-cyan-500' },
              { label: 'Resolved', count: statusMap['RESOLVED'] || 0, bg: 'bg-emerald-500' },
              { label: 'Rejected', count: statusMap['REJECTED'] || 0, bg: 'bg-rose-500' },
              { label: 'Reopened', count: statusMap['REOPENED'] || 0, bg: 'bg-purple-500' },
            ].map((item) => {
              const pct = totalComplaints > 0 ? (item.count / totalComplaints) * 100 : 0;
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-[var(--foreground)]">{item.label}</span>
                    <span className="text-[var(--text-muted)]">
                      {item.count} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[var(--surface-hover)] overflow-hidden">
                    <div
                      className={`h-full ${item.bg} rounded-full transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Department Distribution Table */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4 shadow-xs">
          <h2 className="text-base font-extrabold text-[var(--foreground)] flex items-center gap-2">
            <FolderOpen size={18} className="text-[var(--primary)]" />
            Department Workload Distribution
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[var(--border)] bg-[var(--surface-hover)] text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">
                <tr>
                  <th className="px-3 py-2">Department</th>
                  <th className="px-3 py-2 text-center">Complaints</th>
                  <th className="px-3 py-2 text-center">Staff</th>
                  <th className="px-3 py-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {departmentCounts.map((dept) => (
                  <tr key={dept.id}>
                    <td className="px-3 py-2.5">
                      <strong className="text-[var(--foreground)] block">{dept.name}</strong>
                      <span className="font-mono text-[10px] text-[var(--text-muted)]">{dept.code}</span>
                    </td>
                    <td className="px-3 py-2.5 text-center font-bold text-[var(--foreground)]">
                      {dept._count.complaints}
                    </td>
                    <td className="px-3 py-2.5 text-center font-bold text-[var(--text-secondary)]">
                      {dept._count.profiles}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span className="rounded bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-bold">
                        {dept.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
