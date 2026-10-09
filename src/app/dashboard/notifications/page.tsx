import React from 'react';
import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  Bell,
  Clock,
  ArrowRight,
  CheckCircle,
} from '@phosphor-icons/react/dist/ssr';

export const dynamic = 'force-dynamic';

export default async function CitizenNotificationsPage() {
  const user = await requireRole('CITIZEN');

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div className="border-b border-[var(--border)] pb-5">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
          Realtime Communications
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--foreground)] tracking-tight mt-1">
          Notifications & Activity Alerts ({notifications.length})
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Status updates on your submitted complaints, department assignments, and official resolutions.
        </p>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <div
            key={n.id}
            data-testid={`notification-${n.id}`}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs flex items-start gap-4 hover:border-[var(--primary)] transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bell size={20} weight="bold" />
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[var(--foreground)]">{n.title}</h3>
                <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                  <Clock size={12} />
                  {new Date(n.createdAt).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{n.body}</p>
              {n.link && (
                <Link
                  href={n.link}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[var(--primary)] hover:underline pt-1.5"
                >
                  View Details <ArrowRight size={12} weight="bold" />
                </Link>
              )}
            </div>
          </div>
        ))}

        {notifications.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[var(--border)] p-12 text-center">
            <CheckCircle size={32} className="mx-auto text-[var(--text-muted)] mb-2" />
            <p className="text-xs text-[var(--text-muted)]">
              No notifications yet. You will receive live updates here when municipal workers action your complaints.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
