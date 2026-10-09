import React from 'react';
import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ComplaintStatus, Priority, ComplaintCategory } from '@prisma/client';
import { CATEGORY_DEFINITIONS } from '@/lib/domain/categories';
import {
  MagnifyingGlass,
  Funnel,
  ArrowRight,
  Warning,
  Buildings,
  User,
} from '@phosphor-icons/react/dist/ssr';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    status?: string;
    departmentId?: string;
    priority?: string;
    category?: string;
    unassigned?: string;
    q?: string;
  }>;
}

export default async function AdminComplaintsPage({ searchParams }: PageProps) {
  await requireRole('ADMIN');
  const params = await searchParams;

  const statusFilter = params.status as ComplaintStatus | undefined;
  const priorityFilter = params.priority as Priority | undefined;
  const categoryFilter = params.category as ComplaintCategory | undefined;
  const departmentIdFilter = params.departmentId;
  const unassignedOnly = params.unassigned === 'true';
  const searchQuery = params.q?.trim();

  const [_departments, complaints] = await Promise.all([
    prisma.department.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
    prisma.complaint.findMany({
      where: {
        status: statusFilter ? statusFilter : { not: 'DRAFT' },
        ...(priorityFilter ? { priority: priorityFilter } : {}),
        ...(categoryFilter ? { category: categoryFilter } : {}),
        ...(departmentIdFilter ? { departmentId: departmentIdFilter } : {}),
        ...(unassignedOnly ? { assignedWorkerId: null } : {}),
        ...(searchQuery
          ? {
              OR: [
                { trackingNumber: { contains: searchQuery, mode: 'insensitive' } },
                { title: { contains: searchQuery, mode: 'insensitive' } },
                { address: { contains: searchQuery, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      include: {
        department: true,
        assignedWorker: true,
        citizen: true,
      },
    }),
  ]);

  const statusBadges: Record<ComplaintStatus, { label: string; bg: string; text: string }> = {
    DRAFT: { label: 'Draft', bg: 'bg-gray-100', text: 'text-gray-700' },
    SUBMITTED: { label: 'Submitted', bg: 'bg-sky-100 dark:bg-sky-950/60', text: 'text-sky-800 dark:text-sky-300' },
    UNDER_REVIEW: { label: 'Under Review', bg: 'bg-indigo-100 dark:bg-indigo-950/60', text: 'text-indigo-800 dark:text-indigo-300' },
    ASSIGNED: { label: 'Assigned', bg: 'bg-amber-100 dark:bg-amber-950/60', text: 'text-amber-800 dark:text-amber-300' },
    IN_PROGRESS: { label: 'In Progress', bg: 'bg-cyan-100 dark:bg-cyan-950/60', text: 'text-cyan-800 dark:text-cyan-300' },
    RESOLVED: { label: 'Resolved', bg: 'bg-emerald-100 dark:bg-emerald-950/60', text: 'text-emerald-800 dark:text-emerald-300' },
    REOPENED: { label: 'Reopened', bg: 'bg-rose-100 dark:bg-rose-950/60', text: 'text-rose-800 dark:text-rose-300' },
    REJECTED: { label: 'Rejected', bg: 'bg-red-100 dark:bg-red-950/60', text: 'text-red-800 dark:text-red-300' },
  };

  const priorityBadges: Record<Priority, { label: string; bg: string; text: string }> = {
    LOW: { label: 'Low', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300' },
    MEDIUM: { label: 'Medium', bg: 'bg-blue-100 dark:bg-blue-950/60', text: 'text-blue-800 dark:text-blue-300' },
    HIGH: { label: 'High', bg: 'bg-amber-100 dark:bg-amber-950/60', text: 'text-amber-800 dark:text-amber-300' },
    CRITICAL: { label: 'Critical', bg: 'bg-rose-100 dark:bg-rose-950/60', text: 'text-rose-800 dark:text-rose-300' },
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-400">
            Operations Console
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--foreground)] tracking-tight mt-1">
            Grievance Dispatch Queue ({complaints.length})
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Review citizen submissions, triage AI suggestions, assign departments, and track field resolution.
          </p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <form className="relative flex-1 min-w-[240px]" method="GET">
          <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            name="q"
            defaultValue={searchQuery || ''}
            placeholder="Search tracking ID, keyword, or landmark address..."
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-9 pr-4 py-2 text-xs text-[var(--foreground)] focus:border-[var(--primary)] transition-all shadow-xs"
          />
        </form>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <Link
            href="/admin/complaints"
            className={`rounded-xl px-3 py-2 font-bold border transition-all ${
              !statusFilter && !unassignedOnly
                ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]'
                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)]'
            }`}
          >
            All Active
          </Link>
          <Link
            href="/admin/complaints?status=SUBMITTED"
            className={`rounded-xl px-3 py-2 font-bold border transition-all ${
              statusFilter === 'SUBMITTED'
                ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]'
                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)]'
            }`}
          >
            New Submissions
          </Link>
          <Link
            href="/admin/complaints?unassigned=true"
            className={`rounded-xl px-3 py-2 font-bold border transition-all ${
              unassignedOnly
                ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]'
                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)]'
            }`}
          >
            Unassigned Queue
          </Link>
          <Link
            href="/admin/complaints?priority=CRITICAL"
            className={`rounded-xl px-3 py-2 font-bold border transition-all ${
              priorityFilter === 'CRITICAL'
                ? 'border-rose-300 bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200'
                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)]'
            }`}
          >
            Critical Only
          </Link>
        </div>
      </div>

      {/* Complaints Table */}
      {complaints.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-12 text-center space-y-3 shadow-xs">
          <Funnel size={32} className="mx-auto text-[var(--text-muted)]" />
          <h3 className="text-sm font-black text-[var(--foreground)]">No grievances matched your filters</h3>
          <p className="text-xs text-[var(--text-muted)]">Clear active search or status filters to view all issues.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[var(--border)] bg-[var(--surface-hover)] text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">
                <tr>
                  <th className="px-4 py-3">Tracking ID</th>
                  <th className="px-4 py-3">Grievance</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Assigned Staff</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {complaints.map((item) => {
                  const sBadge = statusBadges[item.status] || statusBadges.SUBMITTED;
                  const pBadge = priorityBadges[item.priority] || priorityBadges.MEDIUM;
                  const catMeta = CATEGORY_DEFINITIONS[item.category];

                  return (
                    <tr key={item.id} className="hover:bg-[var(--surface-hover)]/60 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-bold text-[var(--primary)] whitespace-nowrap">
                        {item.trackingNumber}
                      </td>

                      <td className="px-4 py-3.5 max-w-[280px]">
                        <strong className="text-[var(--foreground)] block truncate">{item.title}</strong>
                        <span className="text-[11px] text-[var(--text-muted)] truncate block mt-0.5">
                          {catMeta?.label || item.category} • {item.address}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${pBadge.bg} ${pBadge.text}`}>
                          {pBadge.label}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-xs font-semibold text-[var(--foreground)]">
                        {item.department?.code ? (
                          <span className="flex items-center gap-1.5">
                            <Buildings size={14} className="text-[var(--primary)]" />
                            {item.department.name}
                          </span>
                        ) : (
                          <span className="text-amber-600 font-bold flex items-center gap-1">
                            <Warning size={14} /> Unassigned
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-[11px] text-[var(--text-secondary)]">
                        {item.assignedWorker ? (
                          <span className="flex items-center gap-1">
                            <User size={13} />
                            {item.assignedWorker.fullName}
                          </span>
                        ) : (
                          <span className="text-[var(--text-muted)] italic">Shared Queue</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${sBadge.bg} ${sBadge.text}`}>
                          {sBadge.label}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <Link
                          href={`/admin/complaints/${item.id}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-[var(--primary-light)] px-2.5 py-1 text-[11px] font-bold text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all shadow-2xs"
                        >
                          Triage <ArrowRight size={11} weight="bold" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
