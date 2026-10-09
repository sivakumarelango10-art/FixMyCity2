import React from 'react';
import Link from 'next/link';
import {
  Buildings,
  ShieldCheck,
  CheckCircle,
  UsersThree,
} from '@phosphor-icons/react/dist/ssr';

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      <div className="text-center space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
          Civic Mission
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-[var(--foreground)] tracking-tight">
          About FixMyCity
        </h1>
        <p className="text-sm text-[var(--text-secondary)] max-w-xl mx-auto">
          One City. One Platform. Every Service. Modern civic engagement designed for responsive municipal governance.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 space-y-6 shadow-xs leading-relaxed text-xs text-[var(--text-secondary)]">
        <div className="space-y-3">
          <h2 className="text-base font-black text-[var(--foreground)]">Our Vision</h2>
          <p>
            FixMyCity empowers citizens to actively participate in the upkeep of their city. By combining mobile-first incident reporting, real-time tracking, transparent municipal operations consoles, and field workforce tools, FixMyCity closes the feedback loop between urban residents and ward administrations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[var(--border)]">
          <div className="p-4 rounded-xl bg-[var(--surface-hover)] space-y-2">
            <UsersThree size={24} className="text-[var(--primary)]" />
            <h3 className="font-bold text-[var(--foreground)]">Citizen Empowerment</h3>
            <p className="text-[11px] text-[var(--text-muted)]">
              Submit photo-verified grievances, track live status milestones, rate resolutions, and reopen cases if unsatisfied.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[var(--surface-hover)] space-y-2">
            <Buildings size={24} className="text-[var(--primary)]" />
            <h3 className="font-bold text-[var(--foreground)]">Operational Console</h3>
            <p className="text-[11px] text-[var(--text-muted)]">
              Triage queue, automated AI advice, department dispatching, and audit-logged operations for administrators.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[var(--surface-hover)] space-y-2">
            <ShieldCheck size={24} className="text-[var(--primary)]" />
            <h3 className="font-bold text-[var(--foreground)]">Field Workforce</h3>
            <p className="text-[11px] text-[var(--text-muted)]">
              Ward-scoped queue claiming, on-site status progression, resolution summaries, and internal communication notes.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--border)] space-y-2">
          <h3 className="font-bold text-[var(--foreground)] flex items-center gap-1.5">
            <CheckCircle size={16} weight="fill" className="text-emerald-600" />
            Civic Transparency & Privacy
          </h3>
          <p>
            FixMyCity implements strict Row-Level Security (RLS) and privacy-first geofencing. Exact citizen addresses and personal details are visible strictly to verified staff on duty.
          </p>
        </div>
      </div>

      <div className="text-center pt-4">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-6 py-3 text-xs font-bold shadow-xs transition-all"
        >
          Explore One-Click Showcase Portals
        </Link>
      </div>
    </div>
  );
}
