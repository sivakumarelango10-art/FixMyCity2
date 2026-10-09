'use server';

import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { executeTransition } from '@/lib/domain/status';
import { EventType, EventVisibility, Priority, ComplaintCategory } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const assignSchema = z.object({
  complaintId: z.string().uuid(),
  departmentId: z.string().uuid(),
  assignedWorkerId: z.string().uuid().nullable().optional(),
  categoryOverride: z.nativeEnum(ComplaintCategory).optional(),
  priorityOverride: z.nativeEnum(Priority).optional(),
  note: z.string().max(1000).optional(),
});

export async function adminAssignComplaint(data: z.infer<typeof assignSchema>) {
  const admin = await requireRole('ADMIN');
  const parsed = assignSchema.parse(data);

  // Verify department exists and is active
  const department = await prisma.department.findUnique({
    where: { id: parsed.departmentId },
  });

  if (!department || !department.isActive) {
    throw new Error('Target department is inactive or does not exist');
  }

  // If assigning specific worker, verify worker belongs to department and is active
  if (parsed.assignedWorkerId) {
    const worker = await prisma.profile.findUnique({
      where: { id: parsed.assignedWorkerId },
    });
    if (!worker || worker.role !== 'WORKER' || worker.departmentId !== department.id || !worker.isActive) {
      throw new Error('Assigned worker must be an active worker in the selected department');
    }
  }

  const result = await executeTransition({
    complaintId: parsed.complaintId,
    toStatus: 'ASSIGNED',
    actor: {
      id: admin.id,
      role: admin.role,
      departmentId: admin.departmentId,
      isActive: admin.isActive,
    },
    departmentId: department.id,
    assignedWorkerId: parsed.assignedWorkerId || null,
    categoryOverride: parsed.categoryOverride,
    priorityOverride: parsed.priorityOverride,
    body: parsed.note || `Complaint assigned to ${department.name}`,
    visibility: EventVisibility.PUBLIC,
  });

  revalidatePath('/admin/complaints');
  revalidatePath(`/admin/complaints/${parsed.complaintId}`);
  revalidatePath(`/dashboard/complaints/${parsed.complaintId}`);

  return { success: true, complaint: result.complaint };
}

export async function adminReviewComplaint(complaintId: string) {
  const admin = await requireRole('ADMIN');

  const result = await executeTransition({
    complaintId,
    toStatus: 'UNDER_REVIEW',
    actor: {
      id: admin.id,
      role: admin.role,
      departmentId: admin.departmentId,
      isActive: admin.isActive,
    },
    body: 'Complaint reviewed by municipal operations officer.',
    visibility: EventVisibility.PUBLIC,
  });

  revalidatePath('/admin/complaints');
  revalidatePath(`/admin/complaints/${complaintId}`);
  revalidatePath(`/dashboard/complaints/${complaintId}`);

  return { success: true, complaint: result.complaint };
}

export async function adminRejectComplaint(complaintId: string, reason: string) {
  const admin = await requireRole('ADMIN');

  if (!reason || reason.trim().length < 3) {
    throw new Error('Rejection reason must be at least 3 characters');
  }

  const result = await executeTransition({
    complaintId,
    toStatus: 'REJECTED',
    actor: {
      id: admin.id,
      role: admin.role,
      departmentId: admin.departmentId,
      isActive: admin.isActive,
    },
    body: reason.trim(),
    visibility: EventVisibility.PUBLIC,
  });

  revalidatePath('/admin/complaints');
  revalidatePath(`/admin/complaints/${complaintId}`);
  revalidatePath(`/dashboard/complaints/${complaintId}`);

  return { success: true, complaint: result.complaint };
}

export async function adminAddNote(
  complaintId: string,
  body: string,
  visibility: EventVisibility = EventVisibility.INTERNAL
) {
  const admin = await requireRole('ADMIN');

  if (!body || body.trim().length < 2) {
    throw new Error('Note body must be at least 2 characters');
  }

  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
  });

  if (!complaint) {
    throw new Error('Complaint not found');
  }

  // Create complaint event (citizenId denormalized)
  const event = await prisma.complaintEvent.create({
    data: {
      complaintId,
      citizenId: complaint.citizenId,
      actorId: admin.id,
      type: EventType.NOTE,
      body: body.trim(),
      visibility,
      resolutionVersion: complaint.resolutionVersion,
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: `ADD_${visibility}_NOTE`,
      entityType: 'COMPLAINT',
      entityId: complaintId,
      metadata: { visibility, notePreview: body.slice(0, 50) },
    },
  });

  revalidatePath(`/admin/complaints/${complaintId}`);
  if (visibility === EventVisibility.PUBLIC) {
    revalidatePath(`/dashboard/complaints/${complaintId}`);
  }

  return { success: true, event };
}
