import React from 'react';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { AnnouncementManager } from './announcement-manager';

export const dynamic = 'force-dynamic';

export default async function AdminAnnouncementsPage() {
  await requireRole('ADMIN');

  const announcements = await prisma.announcement.findMany({
    orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    include: {
      author: {
        select: { fullName: true },
      },
    },
  });

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="border-b border-[var(--border)] pb-5">
        <span className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-400">
          City Communications
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--foreground)] tracking-tight mt-1">
          City Announcements ({announcements.length})
        </h1>
      </div>

      <AnnouncementManager initialAnnouncements={announcements} />
    </div>
  );
}
