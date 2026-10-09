import React from 'react';
import { requireRole } from '@/lib/auth';
import { ReportWizard } from './report-wizard';

export const dynamic = 'force-dynamic';

export default async function ReportIssuePage() {
  const user = await requireRole('CITIZEN');

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="border-b border-[var(--border)] pb-5">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
          Civic Grievance Desk
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--foreground)] tracking-tight mt-1">
          Report a Problem in Your City
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1.5">
          Follow the 4-step wizard to report road, water, sanitation, lighting, or drainage issues.
          Your report will be automatically triaged and routed to the responsible municipal department.
        </p>
      </div>

      <ReportWizard userId={user.id} />
    </div>
  );
}
