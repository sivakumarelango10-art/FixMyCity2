import React from 'react';
import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ComplaintStatus, ComplaintCategory } from '@prisma/client';
import { CATEGORY_DEFINITIONS } from '@/lib/domain/categories';
import {
  Megaphone,
  ArrowRight,
  CalendarBlank,
  MapPin,
  MagnifyingGlass,
  Funnel,
} from '@phosphor-icons/react/dist/ssr';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    status?: string;
    category?: string;
    q?: string;
  }>;
}

export default async function CitizenComplaintsPage({ searchParams }: PageProps) {
  const user = await requireRole('CITIZEN');
  const params = await searchParams;

  const statusFilter = params.status as ComplaintStatus | undefined;
  const categoryFilter = params.category as ComplaintCategory | undefined;
  const searchQuery = params.q?.trim();

  // Exclude DRAFT complaints from list
  const complaints = await prisma.complaint.findMany({
    where: {
      citizenId: user.id,
      status: statusFilter ? statusFilter : { not: 'DRAFT' },
      ...(categoryFilter ? { category: categoryFilter } : {}),
      ...(searchQuery
        ? {
            OR: [
              { trackingNumber: { contains: searchQuery, mode: 'insensitive' } },
              { title: { contains: searchQuery, mode: 'insensitive' } },
              { description: { contains: searchQuery, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      department: true,
      photos: { take: 1 },
    },
  });

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

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
            My Civic Grievance History
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--foreground)] tracking-tight mt-1">
            Tracked Complaints ({complaints.length})
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Real-time tracking of all civic defect reports submitted by your account.
          </p>
        </div>

        <Link
          href="/dashboard/report"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[var(--primary-hover)] transition-all"
        >
          <Megaphone size={16} weight="bold" />
          Report New Issue
        </Link>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <form className="relative flex-1 min-w-[200px]" method="GET">
          <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            name="q"
            defaultValue={searchQuery || ''}
            placeholder="Search by tracking number (e.g. FMC-2026-000001) or title..."
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-9 pr-4 py-2 text-xs text-[var(--foreground)] focus:border-[var(--primary)] transition-all shadow-xs"
          />
        </form>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/complaints"
            className={`rounded-xl px-3 py-2 text-xs font-bold transition-all border ${
              !statusFilter
                ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]'
                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            All
          </Link>
          <Link
            href="/dashboard/complaints?status=IN_PROGRESS"
            className={`rounded-xl px-3 py-2 text-xs font-bold transition-all border ${
              statusFilter === 'IN_PROGRESS'
                ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]'
                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            In Progress
          </Link>
          <Link
            href="/dashboard/complaints?status=RESOLVED"
            className={`rounded-xl px-3 py-2 text-xs font-bold transition-all border ${
              statusFilter === 'RESOLVED'
                ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]'
                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            Resolved
          </Link>
        </div>
      </div>

      {/* Complaints List */}
      {complaints.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-12 text-center space-y-4 shadow-xs">
          <div className="mx-auto w-12 h-12 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center">
            <Funnel size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-[var(--foreground)]">No grievances found</h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
              {searchQuery || statusFilter || categoryFilter
                ? 'No complaints matched your current search filters. Try clearing filters.'
                : 'You have not submitted any complaints yet. Report an issue to help improve Bengaluru!'}
            </p>
          </div>
          <div>
            <Link
              href="/dashboard/report"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[var(--primary-hover)] transition-all"
            >
              Report an Issue Now <ArrowRight size={14} weight="bold" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {complaints.map((item) => {
            const badge = statusBadges[item.status] || statusBadges.SUBMITTED;
            const categoryMeta = CATEGORY_DEFINITIONS[item.category];

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 hover:border-[var(--border-hover)] hover:shadow-xs transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-extrabold text-[var(--primary)]">
                      {item.trackingNumber}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${badge.bg} ${badge.text}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-[var(--foreground)] line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-[var(--foreground)]">
                      {categoryMeta?.label || item.category}
                    </span>
                    <span className="flex items-center gap-1 text-[11px]">
                      <CalendarBlank size={13} />
                      {new Date(item.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1 text-[11px] truncate max-w-[220px]">
                      <MapPin size={13} className="text-[var(--primary)] flex-shrink-0" />
                      {item.address}
                    </span>

                    <Link
                      href={`/dashboard/complaints/${item.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[var(--primary)] hover:underline flex-shrink-0"
                    >
                      View Timeline <ArrowRight size={13} weight="bold" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
