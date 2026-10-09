import React from 'react';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  Megaphone,
  PushPin,
  Clock,
  Sparkle,
} from '@phosphor-icons/react/dist/ssr';

export const dynamic = 'force-dynamic';

export default async function CitizenUpdatesPage() {
  await requireRole('CITIZEN');

  const announcements = await prisma.announcement.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div className="border-b border-[var(--border)] pb-5">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
          Civic Bulletins
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--foreground)] tracking-tight mt-1">
          City Updates & Announcements
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Official advisories, maintenance schedules, and municipal announcements for Bengaluru residents.
        </p>
      </div>

      <div className="space-y-4">
        {announcements.map((a) => (
          <div
            key={a.id}
            data-testid={`update-card-${a.id}`}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xs space-y-2 hover:border-[var(--primary)] transition-all"
          >
            <div className="flex flex-wrap items-center gap-2">
              {a.pinned && (
                <span className="flex items-center gap-1 rounded bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 px-2.5 py-0.5 text-[10px] font-black uppercase">
                  <PushPin size={12} weight="fill" /> PINNED
                </span>
              )}
              <span className="rounded bg-[var(--primary-light)] text-[var(--primary)] px-2.5 py-0.5 text-[10px] font-black uppercase">
                {a.category.replace('_', ' ')}
              </span>
              <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 ml-auto">
                <Clock size={12} />
                {new Date(a.createdAt).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            <h2 className="text-lg font-black text-[var(--foreground)]">{a.title}</h2>

            {a.summary && (
              <p className="text-xs font-semibold text-[var(--text-secondary)]">{a.summary}</p>
            )}

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
              {a.body}
            </p>
          </div>
        ))}

        {announcements.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[var(--border)] p-12 text-center">
            <Sparkle size={32} className="mx-auto text-[var(--text-muted)] mb-2" />
            <p className="text-xs text-[var(--text-muted)]">No published announcements right now.</p>
          </div>
        )}
      </div>
    </div>
  );
}
