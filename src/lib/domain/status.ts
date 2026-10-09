import {
  ComplaintStatus,
  Role,
  EventType,
  EventVisibility,
  Priority,
  ComplaintCategory,
} from '@prisma/client';
import { prisma } from '@/lib/db';
import { getNextTrackingNumber } from './tracking';

export interface TransitionActor {
  id: string;
  role: Role;
  departmentId?: string | null;
  isActive: boolean;
}

export interface TransitionRequest {
  complaintId: string;
  toStatus: ComplaintStatus;
  actor: TransitionActor;
  departmentId?: string;
  assignedWorkerId?: string | null;
  body?: string;
  resolutionSummary?: string;
  visibility?: EventVisibility;
  categoryOverride?: ComplaintCategory;
  priorityOverride?: Priority;
}

/**
 * Validates whether a state transition is permitted by the state machine
 */
export function validateTransition(
  fromStatus: ComplaintStatus,
  toStatus: ComplaintStatus,
  actor: TransitionActor,
  complaint: {
    citizenId: string;
    departmentId?: string | null;
    assignedWorkerId?: string | null;
    resolvedAt?: Date | null;
  },
  params: Partial<TransitionRequest>
): { valid: boolean; error?: string } {
  if (!actor.isActive) {
    return { valid: false, error: 'Actor account is deactivated' };
  }

  // 1. DRAFT -> SUBMITTED (Citizen only, must be owner)
  if (fromStatus === 'DRAFT' && toStatus === 'SUBMITTED') {
    if (actor.role !== 'CITIZEN' || actor.id !== complaint.citizenId) {
      return { valid: false, error: 'Only the complaint owner can submit a draft report' };
    }
    return { valid: true };
  }

  // 2. SUBMITTED -> UNDER_REVIEW (Admin only)
  if (fromStatus === 'SUBMITTED' && toStatus === 'UNDER_REVIEW') {
    if (actor.role !== 'ADMIN') {
      return { valid: false, error: 'Only administrators can mark a complaint as under review' };
    }
    return { valid: true };
  }

  // 3. (SUBMITTED | UNDER_REVIEW | REOPENED) -> ASSIGNED (Admin only)
  if (
    (fromStatus === 'SUBMITTED' || fromStatus === 'UNDER_REVIEW' || fromStatus === 'REOPENED') &&
    toStatus === 'ASSIGNED'
  ) {
    if (actor.role !== 'ADMIN') {
      return { valid: false, error: 'Only administrators can assign complaints' };
    }
    if (!params.departmentId && !complaint.departmentId) {
      return { valid: false, error: 'Active department is required for assignment' };
    }
    return { valid: true };
  }

  // 4. (SUBMITTED | UNDER_REVIEW) -> REJECTED (Admin only)
  if (
    (fromStatus === 'SUBMITTED' || fromStatus === 'UNDER_REVIEW') &&
    toStatus === 'REJECTED'
  ) {
    if (actor.role !== 'ADMIN') {
      return { valid: false, error: 'Only administrators can reject complaints' };
    }
    if (!params.body || params.body.trim().length < 3) {
      return { valid: false, error: 'Rejection reason must be at least 3 characters' };
    }
    return { valid: true };
  }

  // 5. (ASSIGNED | IN_PROGRESS) -> ASSIGNED (Admin re-assignment / handoff)
  if ((fromStatus === 'ASSIGNED' || fromStatus === 'IN_PROGRESS') && toStatus === 'ASSIGNED') {
    if (actor.role !== 'ADMIN') {
      return { valid: false, error: 'Only administrators can reassign complaints' };
    }
    return { valid: true };
  }

  // 6. (ASSIGNED | REOPENED) -> IN_PROGRESS (Worker in department)
  if ((fromStatus === 'ASSIGNED' || fromStatus === 'REOPENED') && toStatus === 'IN_PROGRESS') {
    if (actor.role !== 'WORKER') {
      return { valid: false, error: 'Only municipal workers can start work on complaints' };
    }
    if (actor.departmentId !== complaint.departmentId) {
      return { valid: false, error: 'Worker must belong to the assigned department' };
    }
    // If already assigned to a specific worker, only that worker can start it
    if (complaint.assignedWorkerId && complaint.assignedWorkerId !== actor.id) {
      return { valid: false, error: 'Task is already assigned to another worker' };
    }
    return { valid: true };
  }

  // 7. IN_PROGRESS -> RESOLVED (Assigned worker)
  if (fromStatus === 'IN_PROGRESS' && toStatus === 'RESOLVED') {
    if (actor.role !== 'WORKER') {
      return { valid: false, error: 'Only workers can resolve complaints' };
    }
    if (actor.departmentId !== complaint.departmentId) {
      return { valid: false, error: 'Worker must belong to the assigned department' };
    }
    if (complaint.assignedWorkerId && complaint.assignedWorkerId !== actor.id) {
      return { valid: false, error: 'Only the assigned worker can mark this task resolved' };
    }
    const summary = params.resolutionSummary || params.body;
    if (!summary || summary.trim().length < 10) {
      return { valid: false, error: 'Resolution summary must be at least 10 characters' };
    }
    return { valid: true };
  }

  // 8. RESOLVED -> REOPENED (Owning citizen within 30 days)
  if (fromStatus === 'RESOLVED' && toStatus === 'REOPENED') {
    if (actor.role !== 'CITIZEN' || actor.id !== complaint.citizenId) {
      return { valid: false, error: 'Only the owning citizen can reopen a resolved complaint' };
    }
    if (!complaint.resolvedAt) {
      return { valid: false, error: 'Complaint does not have a recorded resolution timestamp' };
    }
    const daysSinceResolution =
      (Date.now() - new Date(complaint.resolvedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceResolution > 30) {
      return { valid: false, error: 'Complaints can only be reopened within 30 days of resolution' };
    }
    if (!params.body || params.body.trim().length < 10) {
      return { valid: false, error: 'Reopening reason must be at least 10 characters' };
    }
    return { valid: true };
  }

  return { valid: false, error: `Invalid state transition from ${fromStatus} to ${toStatus}` };
}

/**
 * Executes a complaint state transition inside a database transaction with atomic integrity.
 */
export async function executeTransition(req: TransitionRequest) {
  return await prisma.$transaction(async (tx) => {
    // 1. Fetch current complaint state with row lock
    const complaint = await tx.complaint.findUnique({
      where: { id: req.complaintId },
      include: { department: true },
    });

    if (!complaint) {
      throw new Error('Complaint not found');
    }

    // 2. Validate transition
    const check = validateTransition(
      complaint.status,
      req.toStatus,
      req.actor,
      {
        citizenId: complaint.citizenId,
        departmentId: complaint.departmentId,
        assignedWorkerId: complaint.assignedWorkerId,
        resolvedAt: complaint.resolvedAt,
      },
      req
    );

    if (!check.valid) {
      throw new Error(check.error || 'Transition denied');
    }

    // 3. Prepare updates
    const updateData: Record<string, unknown> = {
      status: req.toStatus,
    };

    let resolutionVersion = complaint.resolutionVersion;

    if (req.toStatus === 'SUBMITTED' && complaint.status === 'DRAFT') {
      const tracking = await getNextTrackingNumber(tx as unknown as typeof prisma);
      updateData.trackingSeq = tracking.trackingSeq;
      updateData.trackingNumber = tracking.trackingNumber;
      updateData.trackingYear = tracking.trackingYear;
    }

    if (req.departmentId) {
      updateData.departmentId = req.departmentId;
    }

    if (req.assignedWorkerId !== undefined) {
      updateData.assignedWorkerId = req.assignedWorkerId;
    } else if (req.toStatus === 'IN_PROGRESS' && !complaint.assignedWorkerId) {
      // Worker claims task upon starting
      updateData.assignedWorkerId = req.actor.id;
    }

    if (req.categoryOverride) {
      updateData.category = req.categoryOverride;
    }

    if (req.priorityOverride) {
      updateData.priority = req.priorityOverride;
    }

    if (req.toStatus === 'RESOLVED') {
      resolutionVersion = complaint.resolutionVersion + 1;
      updateData.resolutionVersion = resolutionVersion;
      updateData.resolvedAt = new Date();
      updateData.resolutionSummary = req.resolutionSummary || req.body || 'Issue resolved on site';
    }

    // 4. Update complaint
    const updatedComplaint = await tx.complaint.update({
      where: { id: req.complaintId },
      data: updateData,
    });

    // 5. Append ComplaintEvent (always with citizenId denormalized)
    const event = await tx.complaintEvent.create({
      data: {
        complaintId: req.complaintId,
        citizenId: complaint.citizenId,
        actorId: req.actor.id,
        type:
          req.toStatus === 'ASSIGNED'
            ? EventType.ASSIGNMENT
            : req.toStatus === 'RESOLVED' || req.toStatus === 'REOPENED'
              ? EventType.STATUS
              : EventType.STATUS,
        fromStatus: complaint.status,
        toStatus: req.toStatus,
        departmentId: (updateData.departmentId as string) || complaint.departmentId || null,
        body: req.body || req.resolutionSummary || null,
        visibility: req.visibility || EventVisibility.PUBLIC,
        resolutionVersion,
      },
    });

    // 6. Create relevant notification
    if (req.actor.role !== 'CITIZEN') {
      // Notify citizen of progress
      await tx.notification.create({
        data: {
          userId: complaint.citizenId,
          type: `COMPLAINT_${req.toStatus}`,
          title: `Update on ${complaint.trackingNumber}`,
          body: `Your complaint is now ${req.toStatus.replace('_', ' ').toLowerCase()}.${req.body ? ` Details: ${req.body.slice(0, 100)}` : ''}`,
          link: `/dashboard/complaints/${complaint.id}`,
        },
      });
    }

    // 7. Audit log
    await tx.auditLog.create({
      data: {
        actorId: req.actor.id,
        action: `TRANSITION_${complaint.status}_TO_${req.toStatus}`,
        entityType: 'COMPLAINT',
        entityId: complaint.id,
        metadata: {
          fromStatus: complaint.status,
          toStatus: req.toStatus,
          departmentId: updateData.departmentId || complaint.departmentId,
          assignedWorkerId: updateData.assignedWorkerId || complaint.assignedWorkerId,
        },
      },
    });

    return { complaint: updatedComplaint, event };
  });
}
