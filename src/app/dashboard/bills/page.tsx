import React from 'react';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { BillsWorkspace } from './bills-workspace';

export const dynamic = 'force-dynamic';

export default async function CitizenBillsPage() {
  const user = await requireRole('CITIZEN');

  const [bills, methods, settings] = await Promise.all([
    prisma.bill.findMany({
      where: { citizenId: user.id },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
      include: {
        payment: {
          select: {
            id: true,
            reference: true,
            methodCodeSnapshot: true,
            methodNameSnapshot: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.demoPaymentMethod.findMany({
      where: { isEnabled: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        services: true,
      },
    }),
    prisma.demoPaymentSettings.findUnique({
      where: { id: 'singleton' },
    }),
  ]);

  const serializedBills = bills.map((b) => ({
    id: b.id,
    service: b.service,
    periodLabel: b.periodLabel,
    amount: b.amount.toString(),
    dueDate: b.dueDate,
    status: b.status,
    paidAt: b.paidAt,
    payment: b.payment
      ? {
          id: b.payment.id,
          reference: b.payment.reference,
          methodCodeSnapshot: b.payment.methodCodeSnapshot,
          methodNameSnapshot: b.payment.methodNameSnapshot,
          createdAt: b.payment.createdAt,
        }
      : null,
  }));

  const serializedMethods = methods.map((m) => ({
    code: m.code,
    displayName: m.displayName,
    description: m.description,
    iconName: m.iconName,
    services: m.services.map((s) => ({
      service: s.service,
      isDefault: s.isDefault,
    })),
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div className="border-b border-[var(--border)] pb-5">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
          Municipal Utilities
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--foreground)] tracking-tight mt-1">
          Utility Bills & Simulated Payments
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Review municipal utility bills for electricity, water, waste, and property tax with admin-configurable demo checkout.
        </p>
      </div>

      <BillsWorkspace
        bills={serializedBills}
        availableMethods={serializedMethods}
        isPaymentsPaused={settings?.isPaused ?? false}
      />
    </div>
  );
}
