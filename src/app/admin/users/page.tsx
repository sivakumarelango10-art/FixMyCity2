import React from 'react';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserManager } from './user-manager';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const admin = await requireRole('ADMIN');

  const [users, departments] = await Promise.all([
    prisma.profile.findMany({
      orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
      include: {
        department: {
          select: { id: true, name: true, code: true },
        },
      },
    }),
    prisma.department.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="border-b border-[var(--border)] pb-5">
        <span className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-400">
          Identity & Access Management
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--foreground)] tracking-tight mt-1">
          User & Field Workforce Directory ({users.length})
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Provision new citizens, assign workers to municipal ward departments, adjust account privileges, or remove accounts.
        </p>
      </div>

      <UserManager
        initialUsers={users}
        departments={departments}
        currentAdminId={admin.id}
      />
    </div>
  );
}
