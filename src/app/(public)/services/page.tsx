import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import {
  Wrench,
  Drop,
  Trash,
  Lightbulb,
  Waves,
  Buildings,
  ArrowRight,
  ShieldCheck,
} from '@phosphor-icons/react/dist/ssr';

export const dynamic = 'force-dynamic';

export default async function ServicesPage() {
  const departments = await prisma.department.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });

  const deptIcons: Record<string, typeof Wrench> = {
    ROADS: Wrench,
    WATER: Drop,
    SANITATION: Trash,
    LIGHTING: Lightbulb,
    DRAINAGE: Waves,
    GENERAL: Buildings,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
          Municipal Operations
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-[var(--foreground)] tracking-tight">
          City Services & Ward Departments
        </h1>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          FixMyCity connects Bengaluru residents directly with active municipal field departments for fast, accountable civic problem resolution.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => {
          const Icon = deptIcons[dept.code] || Buildings;
          return (
            <div
              key={dept.id}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4 shadow-xs hover:border-[var(--primary)] transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center">
                  <Icon size={24} weight="bold" />
                </div>
                <h3 className="text-lg font-black text-[var(--foreground)]">{dept.name}</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{dept.description}</p>
              </div>

              <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-[var(--text-muted)]">
                  DEPT: {dept.code}
                </span>
                <Link
                  href="/dashboard/report"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[var(--primary)] hover:underline"
                >
                  Report Issue <ArrowRight size={12} weight="bold" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Demo Utilities Card */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/60 dark:border-amber-900/60 dark:bg-amber-950/20 p-8 text-center max-w-3xl mx-auto space-y-3">
        <ShieldCheck size={32} className="mx-auto text-amber-700" />
        <h3 className="text-lg font-black text-[var(--foreground)]">Utility Payments Simulation</h3>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          Utility bill payments for Electricity (BESCOM), Water (BWSSB), Property Tax (BBMP), and Solid Waste are demonstration-only simulated features. No real banking credentials or transactions are supported.
        </p>
        <Link
          href="/dashboard/bills"
          className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] text-white px-5 py-2.5 text-xs font-bold shadow-xs hover:bg-[var(--primary-hover)] transition-all"
        >
          Explore Demo Bills
        </Link>
      </div>
    </div>
  );
}
