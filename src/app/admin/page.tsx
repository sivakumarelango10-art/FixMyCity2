import React from 'react';
import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  ListDashes,
  Warning,
  ArrowRight,
  CreditCard,
} from '@phosphor-icons/react/dist/ssr';

export default async function AdminOverviewPage() {
  await requireRole('ADMIN');

  // Real DB aggregate counts
  const [
    submittedCount,
    underReviewCount,
    assignedCount,
    inProgressCount,
    resolvedCount,
    rejectedCount,
    reopenedCount,
    recentComplaints,
    departments,
    paymentSettings,
  ] = await Promise.all([
    prisma.complaint.count({ where: { status: 'SUBMITTED' } }),
    prisma.complaint.count({ where: { status: 'UNDER_REVIEW' } }),
    prisma.complaint.count({ where: { status: 'ASSIGNED' } }),
    prisma.complaint.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.complaint.count({ where: { status: 'RESOLVED' } }),
    prisma.complaint.count({ where: { status: 'REJECTED' } }),
    prisma.complaint.count({ where: { status: 'REOPENED' } }),
    prisma.complaint.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: { department: true, citizen: true },
    }),
    prisma.department.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            complaints: {
              where: { status: { in: ['ASSIGNED', 'IN_PROGRESS'] } },
            },
          },
        },
      },
    }),
    prisma.demoPaymentSettings.findUnique({
      where: { id: 'singleton' },
    }),
  ]);

  const pipelineCards = [
    { label: 'Submitted (New)', count: submittedCount, color: 'text-amber-600', href: '/admin/complaints?status=SUBMITTED' },
    { label: 'Under Review', count: underReviewCount, color: 'text-blue-600', href: '/admin/complaints?status=UNDER_REVIEW' },
    { label: 'Assigned', count: assignedCount, color: 'text-indigo-600', href: '/admin/complaints?status=ASSIGNED' },
    { label: 'In Progress', count: inProgressCount, color: 'text-cyan-600', href: '/admin/complaints?status=IN_PROGRESS' },
    { label: 'Resolved', count: resolvedCount, color: 'text-emerald-600', href: '/admin/complaints?status=RESOLVED' },
    { label: 'Reopened', count: reopenedCount, color: 'text-rose-600', href: '/admin/complaints?status=REOPENED' },
    { label: 'Rejected', count: rejectedCount, color: 'text-gray-500', href: '/admin/complaints?status=REJECTED' },
  ];

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
            Operations Console
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--foreground)] tracking-tight">
            Municipal Pipeline Overview
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Real-time complaint triage, department allocation, and demo payment administration
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/complaints"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[var(--primary-hover)] transition-all"
          >
            <ListDashes size={16} weight="bold" />
            Triage Complaints Queue
          </Link>
          <Link
            href="/admin/payment-methods"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-xs font-bold text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-all"
          >
            <CreditCard size={16} weight="bold" />
            Payment Methods
          </Link>
        </div>
      </div>

      {/* Global Payment Pause Warning Banner if active */}
      {paymentSettings?.isPaused && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs font-bold text-amber-900 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Warning size={18} weight="bold" className="text-amber-700" />
            Demo payments are currently globally PAUSED. Citizens cannot initiate checkout until unpaused.
          </span>
          <Link href="/admin/payment-methods" className="underline hover:text-amber-950">
            Manage Settings
          </Link>
        </div>
      )}

      {/* Pipeline Stages Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {pipelineCards.map((card, idx) => (
          <Link
            key={idx}
            href={card.href}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs hover:border-[var(--primary)] transition-all block"
          >
            <div className="text-[10px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">
              {card.label}
            </div>
            <div className={`mt-2 text-2xl font-black ${card.color}`}>{card.count}</div>
          </Link>
        ))}
      </div>

      {/* 2 Columns: Recent Complaints for Triage & Department Workloads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Complaints */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[var(--foreground)]">
              Pending & Recent Reports
            </h2>
            <Link
              href="/admin/complaints"
              className="text-xs font-bold text-[var(--primary)] hover:underline"
            >
              Full queue
            </Link>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-xs">
            {recentComplaints.length === 0 ? (
              <p className="p-8 text-center text-xs text-[var(--text-muted)]">
                No civic complaints filed yet.
              </p>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {recentComplaints.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[var(--primary)]">
                          {c.trackingNumber}
                        </span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[var(--background)] text-[var(--text-secondary)] border border-[var(--border)]">
                          {c.status.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                          {c.priority}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-[var(--foreground)] mt-1">
                        {c.title}
                      </h4>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        {c.department?.name || 'Unassigned department'} • By {c.citizen.fullName}
                      </p>
                    </div>

                    <Link
                      href={`/admin/complaints/${c.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[var(--primary)] hover:underline whitespace-nowrap"
                    >
                      Review & Assign <ArrowRight size={12} weight="bold" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Department Workloads */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[var(--foreground)]">
              Department Workload
            </h2>
            <Link
              href="/admin/departments"
              className="text-xs font-bold text-[var(--primary)] hover:underline"
            >
              Manage
            </Link>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs space-y-3">
            {departments.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between border-b border-[var(--border)] pb-2.5 last:border-0 last:pb-0 text-xs"
              >
                <div>
                  <div className="font-bold text-[var(--foreground)]">{d.name}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">Code: {d.code}</div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-sm text-[var(--primary)]">
                    {d._count.complaints}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] block">active</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
