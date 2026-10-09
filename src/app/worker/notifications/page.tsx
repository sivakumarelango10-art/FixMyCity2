import React from 'react';
import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  Bell,
  Clock,
  ArrowRight,
} from '@phosphor-icons/react/dist/ssr';

export const dynamic = 'force-dynamic';

export default async function WorkerNotificationsPage() {
  const worker = await requireRole('WORKER');

  const notifications = await prisma.notification.findMany({
    where: { userId: worker.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="border-b border-[var(--border)] pb-5">
        <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
          Field Alerts
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--foreground)] tracking-tight mt-1">
          Worker Notifications ({notifications.length})
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Operational alerts, new complaint assignments, and administrative notices.
        </p>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <div
            key={n.id}
            data-testid={`worker-notification-${n.id}`}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs flex items-start gap-4"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bell size={18} weight="bold" />
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-[var(--foreground)]">{n.title}</h4>
                <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                  <Clock size={12} />
                  {new Date(n.createdAt).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">{n.body}</p>
              {n.link && (
                <Link
                  href={n.link}
                  className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:underline pt-1"
                >
                  View Details <ArrowRight size={12} weight="bold" />
                </Link>
              )}
            </div>
          </div>
        ))}

        {notifications.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[var(--border)] p-12 text-center">
            <Bell size={32} className="mx-auto text-[var(--text-muted)] mb-2" />
            <p className="text-xs text-[var(--text-muted)]">
              No notifications at this time. You are all caught up!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
