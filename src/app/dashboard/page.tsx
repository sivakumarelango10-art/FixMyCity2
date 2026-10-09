import React from 'react';
import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  Megaphone,
  CheckCircle,
  ClockAfternoon,
  ArrowRight,
  Receipt,
  Bell,
  WarningCircle,
  CalendarBlank,
} from '@phosphor-icons/react/dist/ssr';

export default async function CitizenOverviewPage() {
  const user = await requireRole('CITIZEN');

  // Load user's real database records
  const [complaints, unpaidBills, unreadNotifications] = await Promise.all([
    prisma.complaint.findMany({
      where: { citizenId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { department: true },
    }),
    prisma.bill.findMany({
      where: { citizenId: user.id, status: 'UNPAID' },
      orderBy: { dueDate: 'asc' },
      take: 3,
    }),
    prisma.notification.count({
      where: { userId: user.id, readAt: null },
    }),
  ]);

  const activeComplaints = complaints.filter(
    (c) => c.status !== 'RESOLVED' && c.status !== 'REJECTED'
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome & Action Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
            Welcome back
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--foreground)] tracking-tight">
            {user.fullName}
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Track your submitted issues or report a new municipal grievance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/report"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-[var(--primary-hover)] transition-all"
          >
            <Megaphone size={18} weight="bold" />
            Report New Issue
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)]">
            <span>ACTIVE COMPLAINTS</span>
            <ClockAfternoon size={18} className="text-amber-600" />
          </div>
          <div className="mt-2 text-3xl font-black text-[var(--foreground)]">
            {activeComplaints.length}
          </div>
          <Link
            href="/dashboard/complaints"
            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[var(--primary)] hover:underline"
          >
            View all reports <ArrowRight size={12} weight="bold" />
          </Link>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)]">
            <span>PENDING DEMO BILLS</span>
            <Receipt size={18} className="text-teal-600" />
          </div>
          <div className="mt-2 text-3xl font-black text-[var(--foreground)]">
            {unpaidBills.length}
          </div>
          <Link
            href="/dashboard/bills"
            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[var(--primary)] hover:underline"
          >
            Review bills <ArrowRight size={12} weight="bold" />
          </Link>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)]">
            <span>UNREAD ALERTS</span>
            <Bell size={18} className="text-indigo-600" />
          </div>
          <div className="mt-2 text-3xl font-black text-[var(--foreground)]">
            {unreadNotifications}
          </div>
          <Link
            href="/dashboard/notifications"
            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[var(--primary)] hover:underline"
          >
            Check notifications <ArrowRight size={12} weight="bold" />
          </Link>
        </div>
      </div>

      {/* Main Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Recent Complaints */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-[var(--foreground)]">
              My Recent Complaints
            </h2>
            <Link
              href="/dashboard/complaints"
              className="text-xs font-bold text-[var(--primary)] hover:underline"
            >
              See all
            </Link>
          </div>

          {complaints.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={24} weight="duotone" />
              </div>
              <h3 className="text-base font-bold text-[var(--foreground)]">No issues reported yet</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm mx-auto">
                Spotted a pothole, broken streetlight, or garbage backlog? File a report with geolocation and photos.
              </p>
              <Link
                href="/dashboard/report"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[var(--primary-hover)] transition-colors"
              >
                <Megaphone size={14} weight="bold" />
                Report First Issue
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {complaints.map((item) => (
                <Link
                  key={item.id}
                  href={`/dashboard/complaints/${item.id}`}
                  className="block rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs hover:border-[var(--primary)] transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[var(--primary)]">
                          {item.trackingNumber}
                        </span>
                        <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-[var(--background)] text-[var(--text-secondary)] border border-[var(--border)]">
                          {item.status.replace('_', ' ')}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-[var(--foreground)] mt-1">
                        {item.title}
                      </h4>
                      <p className="text-xs text-[var(--text-muted)] line-clamp-1 mt-0.5">
                        {item.address}
                      </p>
                    </div>

                    <div className="text-right sm:flex sm:flex-col sm:items-end">
                      <span className="text-[11px] text-[var(--text-muted)]">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-xs font-bold text-[var(--primary)] flex items-center gap-1 mt-1">
                        View Details <ArrowRight size={12} weight="bold" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Demo Bills & Quick Actions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-[var(--foreground)]">
              Simulated Utility Bills
            </h2>
            <Link
              href="/dashboard/bills"
              className="text-xs font-bold text-[var(--primary)] hover:underline"
            >
              All bills
            </Link>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              <WarningCircle size={16} weight="bold" className="flex-shrink-0" />
              <span>Demo simulation only. No real money or bank accounts are connected.</span>
            </div>

            {unpaidBills.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] text-center py-4">
                All demo utility bills are currently settled!
              </p>
            ) : (
              <div className="space-y-3">
                {unpaidBills.map((bill) => (
                  <div
                    key={bill.id}
                    className="flex items-center justify-between border-b border-[var(--border)] pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <div className="text-xs font-bold text-[var(--foreground)]">
                        {bill.service.replace('_', ' ')}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                        <CalendarBlank size={12} />
                        Due: {new Date(bill.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-[var(--foreground)]">
                        ₹{Number(bill.amount).toFixed(2)}
                      </div>
                      <Link
                        href={`/dashboard/bills/${bill.id}`}
                        className="text-[11px] font-bold text-[var(--primary)] hover:underline"
                      >
                        Pay (Demo)
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
