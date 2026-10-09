import React from 'react';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { DepartmentManager } from './department-manager';

export const dynamic = 'force-dynamic';

export default async function AdminDepartmentsPage() {
  await requireRole('ADMIN');

  const departments = await prisma.department.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: {
          profiles: true,
          complaints: {
            where: { status: { in: ['ASSIGNED', 'IN_PROGRESS', 'REOPENED'] } },
          },
        },
      },
    },
  });

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="border-b border-[var(--border)] pb-5">
        <span className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-400">
          Municipal Operations Structure
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--foreground)] tracking-tight mt-1">
          Municipal Departments ({departments.length})
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Add, configure, update, or remove ward-level operational authorities responsible for civic complaint resolution.
        </p>
      </div>

      <DepartmentManager initialDepartments={departments} />
    </div>
  );
}
