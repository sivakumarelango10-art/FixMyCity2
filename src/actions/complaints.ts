'use server';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { executeTransition } from '@/lib/domain/status';
import { classifyComplaint } from '@/lib/ai/gemini';
import { getDepartmentForCategory } from '@/lib/domain/categories';
import { ComplaintCategory, Priority, EventType, EventVisibility } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import crypto from 'crypto';

const draftSchema = z.object({
  draftId: z.string().uuid().optional(),
  title: z.string().min(8, 'Title must be at least 8 characters').max(120),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000),
  category: z.nativeEnum(ComplaintCategory),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().min(5, 'Address must be at least 5 characters').max(200),
  publicAreaLabel: z.string().max(100).optional(),
  isPublic: z.boolean().default(false),
  additionalNotes: z.string().max(1000).optional(),
});

export async function saveDraftComplaint(formData: z.infer<typeof draftSchema>) {
  const user = await getCurrentUser();
  if (!user || !user.isActive) {
    throw new Error('Unauthorized');
  }

  let parsed: z.infer<typeof draftSchema>;
  try {
    parsed = draftSchema.parse(formData);
  } catch (err) {
    if (err instanceof z.ZodError && err.issues.some((i) => i.path.includes('category'))) {
      throw new Error('Please select a valid complaint category.');
    }
    throw new Error('Unable to submit your complaint right now. Please try again.');
  }

  const departmentCode = getDepartmentForCategory(parsed.category);
  let department;
  try {
    department = await prisma.department.findUnique({
      where: { code: departmentCode },
    });
  } catch (dbErr) {
    console.error('[SaveDraft Database Error]:', dbErr);
    throw new Error('Unable to submit your complaint right now. Please try again.');
  }

  if (!department || !department.isActive) {
    throw new Error('The responsible department is currently unavailable. Please try again later.');
  }

  const now = new Date();
  const year = now.getFullYear();

  try {
    if (parsed.draftId) {
      // Verify owner
      const existing = await prisma.complaint.findUnique({
        where: { id: parsed.draftId },
      });

      if (!existing || existing.citizenId !== user.id || existing.status !== 'DRAFT') {
        throw new Error('Draft not found or invalid');
      }

      const updated = await prisma.complaint.update({
        where: { id: parsed.draftId },
        data: {
          title: parsed.title,
          description: parsed.description,
          category: parsed.category,
          latitude: parsed.latitude,
          longitude: parsed.longitude,
          address: parsed.address,
          publicAreaLabel: parsed.publicAreaLabel || null,
          isPublic: parsed.isPublic,
          additionalNotes: parsed.additionalNotes || null,
          departmentId: department.id,
        },
        include: { photos: true },
      });

      return { success: true, complaint: updated };
    }

    // Create new draft
    const draftTracking = `DRAFT-${crypto.randomUUID().slice(0, 8)}`;
    const created = await prisma.complaint.create({
      data: {
        trackingNumber: draftTracking,
        trackingYear: year,
        citizenId: user.id,
        title: parsed.title,
        description: parsed.description,
        category: parsed.category,
        priority: Priority.MEDIUM,
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        address: parsed.address,
        publicAreaLabel: parsed.publicAreaLabel || null,
        isPublic: parsed.isPublic,
        additionalNotes: parsed.additionalNotes || null,
        status: 'DRAFT',
        departmentId: department.id,
      },
      include: { photos: true },
    });

    return { success: true, complaint: created };
  } catch (err) {
    if (err instanceof Error && err.message === 'Draft not found or invalid') {
      throw err;
    }
    console.error('[SaveDraft Persistence Error]:', err);
    throw new Error('Unable to submit your complaint right now. Please try again.');
  }
}

export async function submitFinalComplaint(complaintId: string) {
  const user = await getCurrentUser();
  if (!user || !user.isActive) {
    throw new Error('Unauthorized');
  }

  let complaint;
  try {
    // Verify complaint is in DRAFT
    complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      include: { photos: true },
    });
  } catch (dbErr) {
    console.error('[SubmitFinalComplaint Lookup Error]:', dbErr);
    throw new Error('Unable to submit your complaint right now. Please try again.');
  }

  if (!complaint || complaint.citizenId !== user.id) {
    throw new Error('Complaint not found or unauthorized');
  }

  if (complaint.status !== 'DRAFT') {
    throw new Error('Complaint has already been submitted');
  }

  // Run final AI classification
  const aiResult = await classifyComplaint({
    title: complaint.title,
    description: complaint.description,
  });

  let department;
  try {
    department = await prisma.department.findUnique({
      where: { code: aiResult.departmentCode },
    });
  } catch (dbErr) {
    console.error('[SubmitFinalComplaint Department Lookup Error]:', dbErr);
    throw new Error('Unable to submit your complaint right now. Please try again.');
  }

  if (!department || !department.isActive) {
    // Fallback to General department if suggested department is unavailable
    try {
      department = await prisma.department.findUnique({
        where: { code: 'GENERAL' },
      });
    } catch {
      // Continue to check
    }
  }

  if (!department || !department.isActive) {
    throw new Error('The responsible department is currently unavailable. Please try again later.');
  }

  try {
    // Execute transition DRAFT -> SUBMITTED
    const result = await executeTransition({
      complaintId: complaint.id,
      toStatus: 'SUBMITTED',
      actor: {
        id: user.id,
        role: user.role,
        departmentId: user.departmentId,
        isActive: user.isActive,
      },
      departmentId: department.id,
    });

    // Store AI advisory fields
    await prisma.complaint.update({
      where: { id: complaint.id },
      data: {
        aiCategory: aiResult.category,
        aiPriority: aiResult.priority,
        aiDepartmentCode: aiResult.departmentCode,
        aiExplanation: aiResult.explanation,
        aiSource: aiResult.source,
      },
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/complaints');
    revalidatePath(`/dashboard/complaints/${complaint.id}`);

    return {
      success: true,
      trackingNumber: result.complaint.trackingNumber,
      complaintId: result.complaint.id,
    };
  } catch (dbErr) {
    console.error('[SubmitFinalComplaint Transition Error]:', dbErr);
    throw new Error('Unable to submit your complaint right now. Please try again.');
  }
}

export async function rateComplaintResolution(complaintId: string, rating: number, comment?: string) {
  const user = await getCurrentUser();
  if (!user || !user.isActive || user.role !== 'CITIZEN') {
    throw new Error('Unauthorized');
  }

  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
  });

  if (!complaint || complaint.citizenId !== user.id) {
    throw new Error('Complaint not found');
  }

  if (complaint.status !== 'RESOLVED') {
    throw new Error('Only resolved complaints can be rated');
  }

  // Check if citizen already rated this resolution version
  const existingRating = await prisma.complaintEvent.findFirst({
    where: {
      complaintId,
      type: EventType.FEEDBACK,
      resolutionVersion: complaint.resolutionVersion,
    },
  });

  if (existingRating) {
    throw new Error('You have already rated this resolution cycle');
  }

  // Record feedback event
  await prisma.complaintEvent.create({
    data: {
      complaintId,
      citizenId: user.id,
      actorId: user.id,
      type: EventType.FEEDBACK,
      visibility: EventVisibility.PUBLIC,
      rating,
      body: comment || `Citizen rated resolution ${rating}/5 stars`,
      resolutionVersion: complaint.resolutionVersion,
    },
  });

  revalidatePath(`/dashboard/complaints/${complaintId}`);
  return { success: true };
}

export async function reopenComplaint(complaintId: string, reason: string) {
  const user = await getCurrentUser();
  if (!user || !user.isActive || user.role !== 'CITIZEN') {
    throw new Error('Unauthorized');
  }

  if (!reason || reason.trim().length < 10) {
    throw new Error('Reopen reason must be at least 10 characters');
  }

  const result = await executeTransition({
    complaintId,
    toStatus: 'REOPENED',
    actor: {
      id: user.id,
      role: user.role,
      departmentId: user.departmentId,
      isActive: user.isActive,
    },
    body: reason.trim(),
  });

  revalidatePath(`/dashboard/complaints/${complaintId}`);
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/complaints');

  return { success: true, trackingNumber: result.complaint.trackingNumber };
}
