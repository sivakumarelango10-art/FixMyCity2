'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { executeTransition } from '@/lib/domain/status';
import { EventVisibility, EventType } from '@prisma/client';

const ClaimSchema = z.object({
  complaintId: z.string().uuid(),
});

const StartTaskSchema = z.object({
  complaintId: z.string().uuid(),
});

const AddNoteSchema = z.object({
  complaintId: z.string().uuid(),
  body: z.string().trim().min(3, 'Note must be at least 3 characters').max(1000),
  visibility: z.nativeEnum(EventVisibility).default(EventVisibility.INTERNAL),
});

const ResolveTaskSchema = z.object({
  complaintId: z.string().uuid(),
  resolutionSummary: z
    .string()
    .trim()
    .min(10, 'Resolution summary must be at least 10 characters')
    .max(1000),
});

export async function workerClaimTask(input: z.infer<typeof ClaimSchema>) {
  const worker = await requireRole('WORKER');

  const parsed = ClaimSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid complaint ID' };
  }

  const { complaintId } = parsed.data;

  // Run in transaction with row lock
  return await prisma.$transaction(async (tx) => {
    const complaint = await tx.complaint.findUnique({
      where: { id: complaintId },
      include: { department: true },
    });

    if (!complaint) {
      return { success: false, error: 'Complaint not found' };
    }

    if (complaint.departmentId !== worker.departmentId) {
      return {
        success: false,
        error: 'This task belongs to another department. You can only claim tasks from your assigned department.',
      };
    }

    if (complaint.assignedWorkerId && complaint.assignedWorkerId !== worker.id) {
      return {
        success: false,
        error: 'This task has already been claimed or assigned to another worker.',
      };
    }

    if (complaint.status !== 'ASSIGNED' && complaint.status !== 'REOPENED') {
      return {
        success: false,
        error: `Cannot claim task with status ${complaint.status}.`,
      };
    }

    const updated = await tx.complaint.update({
      where: { id: complaintId },
      data: {
        assignedWorkerId: worker.id,
      },
    });

    await tx.complaintEvent.create({
      data: {
        complaintId,
        citizenId: complaint.citizenId,
        actorId: worker.id,
        type: EventType.ASSIGNMENT,
        fromStatus: complaint.status,
        toStatus: complaint.status,
        departmentId: complaint.departmentId,
        body: `Task claimed by field officer ${worker.fullName}`,
        visibility: EventVisibility.PUBLIC,
        resolutionVersion: complaint.resolutionVersion,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: worker.id,
        action: 'WORKER_CLAIM_TASK',
        entityType: 'COMPLAINT',
        entityId: complaintId,
        metadata: {
          trackingNumber: complaint.trackingNumber,
          workerId: worker.id,
          workerName: worker.fullName,
        },
      },
    });

    revalidatePath('/worker');
    revalidatePath('/worker/queue');
    revalidatePath('/worker/my-tasks');
    revalidatePath(`/worker/tasks/${complaintId}`);
    return { success: true, complaint: updated };
  });
}

export async function workerStartTask(input: z.infer<typeof StartTaskSchema>) {
  const worker = await requireRole('WORKER');

  const parsed = StartTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid complaint ID' };
  }

  const { complaintId } = parsed.data;

  try {
    const res = await executeTransition({
      complaintId,
      toStatus: 'IN_PROGRESS',
      actor: {
        id: worker.id,
        role: 'WORKER',
        departmentId: worker.departmentId,
        isActive: worker.isActive,
      },
      body: `Work commenced on site by field officer ${worker.fullName}`,
      visibility: EventVisibility.PUBLIC,
    });

    revalidatePath('/worker');
    revalidatePath('/worker/my-tasks');
    revalidatePath('/worker/in-progress');
    revalidatePath(`/worker/tasks/${complaintId}`);
    revalidatePath(`/dashboard/complaints/${complaintId}`);
    return { success: true, complaint: res.complaint };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

export async function workerAddNote(input: z.infer<typeof AddNoteSchema>) {
  const worker = await requireRole('WORKER');

  const parsed = AddNoteSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid note data' };
  }

  const { complaintId, body, visibility } = parsed.data;

  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
  });

  if (!complaint) {
    return { success: false, error: 'Complaint not found' };
  }

  if (complaint.departmentId !== worker.departmentId) {
    return { success: false, error: 'Access denied: task belongs to another department' };
  }

  const event = await prisma.complaintEvent.create({
    data: {
      complaintId,
      citizenId: complaint.citizenId,
      actorId: worker.id,
      type: EventType.NOTE,
      body,
      visibility,
      resolutionVersion: complaint.resolutionVersion,
    },
  });

  if (visibility === EventVisibility.PUBLIC) {
    await prisma.notification.create({
      data: {
        userId: complaint.citizenId,
        type: 'COMPLAINT_UPDATE',
        title: `Officer Update on ${complaint.trackingNumber}`,
        body: body.slice(0, 150),
        link: `/dashboard/complaints/${complaint.id}`,
      },
    });
  }

  revalidatePath(`/worker/tasks/${complaintId}`);
  revalidatePath(`/dashboard/complaints/${complaintId}`);
  return { success: true, event };
}

export async function workerResolveTask(input: z.infer<typeof ResolveTaskSchema>) {
  const worker = await requireRole('WORKER');

  const parsed = ResolveTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid resolution data' };
  }

  const { complaintId, resolutionSummary } = parsed.data;

  try {
    const res = await executeTransition({
      complaintId,
      toStatus: 'RESOLVED',
      actor: {
        id: worker.id,
        role: 'WORKER',
        departmentId: worker.departmentId,
        isActive: worker.isActive,
      },
      resolutionSummary,
      visibility: EventVisibility.PUBLIC,
    });

    revalidatePath('/worker');
    revalidatePath('/worker/my-tasks');
    revalidatePath('/worker/history');
    revalidatePath(`/worker/tasks/${complaintId}`);
    revalidatePath(`/dashboard/complaints/${complaintId}`);
    return { success: true, complaint: res.complaint };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}
