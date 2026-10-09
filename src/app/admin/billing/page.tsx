import React from 'react';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ShieldCheck } from '@phosphor-icons/react/dist/ssr';
import { BillingManager } from './billing-manager';

export const dynamic = 'force-dynamic';

export default async function AdminBillingPage() {
  await requireRole('ADMIN');

  const [bills, citizens] = await Promise.all([
    prisma.bill.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        citizen: {
          select: { fullName: true, email: true },
        },
        payment: {
          select: {
            id: true,
            reference: true,
            methodCodeSnapshot: true,
            methodNameSnapshot: true,
            isApproved: true,
            approvedAt: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.profile.findMany({
      where: { role: 'CITIZEN', isActive: true },
      select: { id: true, fullName: true, email: true },
      orderBy: { fullName: 'asc' },
    }),
  ]);

  const totalBilled = bills.reduce((acc, b) => acc + Number(b.amount), 0);
  const totalCollected = bills
    .filter((b) => b.status === 'PAID')
    .reduce((acc, b) => acc + Number(b.amount), 0);

  const serializedBills = bills.map((b) => ({
    id: b.id,
    service: b.service,
    periodLabel: b.periodLabel,
    amount: b.amount.toString(),
    dueDate: b.dueDate,
    status: b.status,
    createdAt: b.createdAt,
    citizen: b.citizen,
    payment: b.payment
      ? {
          id: b.payment.id,
          reference: b.payment.reference,
          methodCodeSnapshot: b.payment.methodCodeSnapshot,
          methodNameSnapshot: b.payment.methodNameSnapshot,
          isApproved: b.payment.isApproved,
          approvedAt: b.payment.approvedAt,
          createdAt: b.payment.createdAt,
        }
      : null,
  }));

  return (
    <div className="space-y-8 max-w-7xl">
      <div className="border-b border-[var(--border)] pb-5">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded bg-teal-100 dark:bg-teal-900/60 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-teal-800 dark:text-teal-200">
            <ShieldCheck size={12} weight="bold" /> Simulation Only
          </span>
          <span className="text-xs text-[var(--text-muted)]">
            • No real payment processor or banking connection
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--foreground)] tracking-tight mt-1">
          Demo Billing & Treasury Administration
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Issue simulated utility invoices to citizens, inspect citizen payment transactions, and reconcile treasury approvals.
        </p>
      </div>

      {/* Aggregate Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] block">
            TOTAL INVOICES ISSUED
          </span>
          <div className="text-2xl font-black text-[var(--foreground)] mt-1">
            {bills.length} Bills
          </div>
          <span className="text-xs text-[var(--text-muted)] mt-1 block">
            Sum: ₹ {totalBilled.toFixed(2)}
          </span>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
            SIMULATED REVENUE SETTLED
          </span>
          <div className="text-2xl font-black text-emerald-800 dark:text-emerald-300 mt-1">
            ₹ {totalCollected.toFixed(2)}
          </div>
          <span className="text-xs text-[var(--text-muted)] mt-1 block">
            {bills.filter((b) => b.status === 'PAID').length} invoices settled
          </span>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
            PENDING RECONCILIATION
          </span>
          <div className="text-2xl font-black text-amber-800 dark:text-amber-300 mt-1">
            {bills.filter((b) => b.payment && !b.payment.isApproved).length} Payments
          </div>
          <span className="text-xs text-[var(--text-muted)] mt-1 block">
            Awaiting treasury approval
          </span>
        </div>
      </div>

      {/* Billing Manager Workspace */}
      <BillingManager
        initialBills={serializedBills}
        citizens={citizens}
      />
    </div>
  );
}
