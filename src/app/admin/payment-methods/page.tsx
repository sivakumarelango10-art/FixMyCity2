import React from 'react';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PaymentMethodsManager } from './payment-methods-manager';

export const dynamic = 'force-dynamic';

export default async function AdminPaymentMethodsPage() {
  await requireRole('ADMIN');

  const [methods, settings] = await Promise.all([
    prisma.demoPaymentMethod.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        services: true,
      },
    }),
    prisma.demoPaymentSettings.findUnique({
      where: { id: 'singleton' },
    }),
  ]);

  return (
    <div className="space-y-6 max-w-7xl">
      <PaymentMethodsManager
        initialMethods={methods}
        isPaused={settings?.isPaused || false}
      />
    </div>
  );
}
