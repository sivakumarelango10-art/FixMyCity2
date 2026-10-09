'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { AnnouncementCategory, AnnouncementStatus } from '@prisma/client';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';

const CreateAnnouncementSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(150),
  summary: z.string().trim().max(300).optional(),
  body: z.string().trim().min(10, 'Body must be at least 10 characters').max(4000),
  category: z.nativeEnum(AnnouncementCategory).default(AnnouncementCategory.GENERAL),
  status: z.nativeEnum(AnnouncementStatus).default(AnnouncementStatus.PUBLISHED),
  pinned: z.boolean().default(false),
});

const UpdateAnnouncementSchema = CreateAnnouncementSchema.extend({
  id: z.string().uuid(),
});

export async function adminCreateAnnouncement(input: z.infer<typeof CreateAnnouncementSchema>) {
  const admin = await requireRole('ADMIN');

  const parsed = CreateAnnouncementSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Validation error' };
  }

  const { title, summary, body, category, status, pinned } = parsed.data;

  const announcement = await prisma.announcement.create({
    data: {
      title,
      summary: summary || null,
      body,
      category,
      status,
      pinned,
      publishedAt: status === AnnouncementStatus.PUBLISHED ? new Date() : null,
      authorId: admin.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: 'CREATE_ANNOUNCEMENT',
      entityType: 'ANNOUNCEMENT',
      entityId: announcement.id,
      metadata: { title, category, status, pinned },
    },
  });

  revalidatePath('/admin/announcements');
  revalidatePath('/updates');
  revalidatePath('/dashboard/updates');
  revalidatePath('/');
  return { success: true, announcement };
}

export async function adminUpdateAnnouncement(input: z.infer<typeof UpdateAnnouncementSchema>) {
  const admin = await requireRole('ADMIN');

  const parsed = UpdateAnnouncementSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Validation error' };
  }

  const { id, title, summary, body, category, status, pinned } = parsed.data;

  const existing = await prisma.announcement.findUnique({
    where: { id },
  });
  if (!existing) {
    return { success: false, error: 'Announcement not found' };
  }

  const updated = await prisma.announcement.update({
    where: { id },
    data: {
      title,
      summary: summary || null,
      body,
      category,
      status,
      pinned,
      publishedAt:
        status === AnnouncementStatus.PUBLISHED && !existing.publishedAt
          ? new Date()
          : existing.publishedAt,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: 'UPDATE_ANNOUNCEMENT',
      entityType: 'ANNOUNCEMENT',
      entityId: id,
      metadata: { title, category, status, pinned },
    },
  });

  revalidatePath('/admin/announcements');
  revalidatePath('/updates');
  revalidatePath('/dashboard/updates');
  revalidatePath('/');
  return { success: true, announcement: updated };
}

export async function adminDeleteAnnouncement(id: string) {
  const admin = await requireRole('ADMIN');

  const existing = await prisma.announcement.findUnique({
    where: { id },
  });
  if (!existing) {
    return { success: false, error: 'Announcement not found' };
  }

  await prisma.announcement.delete({
    where: { id },
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: 'DELETE_ANNOUNCEMENT',
      entityType: 'ANNOUNCEMENT',
      entityId: id,
      metadata: { title: existing.title },
    },
  });

  revalidatePath('/admin/announcements');
  revalidatePath('/updates');
  revalidatePath('/dashboard/updates');
  revalidatePath('/');
  return { success: true };
}
