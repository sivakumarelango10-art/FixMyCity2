import { describe, it, expect } from 'vitest';
import { validateTransition, TransitionActor } from '@/lib/domain/status';

describe('Phase 2: Complaint State Machine Transitions', () => {
  const citizenActor: TransitionActor = {
    id: 'citizen-uuid-1',
    role: 'CITIZEN',
    isActive: true,
  };

  const adminActor: TransitionActor = {
    id: 'admin-uuid-1',
    role: 'ADMIN',
    isActive: true,
  };

  const roadsWorkerActor: TransitionActor = {
    id: 'worker-roads-1',
    role: 'WORKER',
    departmentId: 'dept-roads-uuid',
    isActive: true,
  };

  const waterWorkerActor: TransitionActor = {
    id: 'worker-water-1',
    role: 'WORKER',
    departmentId: 'dept-water-uuid',
    isActive: true,
  };

  const baseComplaint = {
    citizenId: 'citizen-uuid-1',
    departmentId: 'dept-roads-uuid',
    assignedWorkerId: null,
    resolvedAt: null,
  };

  it('allows citizen owner to transition DRAFT -> SUBMITTED', () => {
    const res = validateTransition('DRAFT', 'SUBMITTED', citizenActor, baseComplaint, {});
    expect(res.valid).toBe(true);
  });

  it('denies non-owner or admin from transitioning DRAFT -> SUBMITTED', () => {
    const otherCitizen: TransitionActor = { id: 'other-user', role: 'CITIZEN', isActive: true };
    const res = validateTransition('DRAFT', 'SUBMITTED', otherCitizen, baseComplaint, {});
    expect(res.valid).toBe(false);
    expect(res.error).toContain('Only the complaint owner');
  });

  it('allows admin to transition SUBMITTED -> UNDER_REVIEW', () => {
    const res = validateTransition('SUBMITTED', 'UNDER_REVIEW', adminActor, baseComplaint, {});
    expect(res.valid).toBe(true);
  });

  it('allows admin to assign complaint to department', () => {
    const res = validateTransition('SUBMITTED', 'ASSIGNED', adminActor, baseComplaint, {
      departmentId: 'dept-roads-uuid',
    });
    expect(res.valid).toBe(true);
  });

  it('denies citizen from assigning complaint', () => {
    const res = validateTransition('SUBMITTED', 'ASSIGNED', citizenActor, baseComplaint, {
      departmentId: 'dept-roads-uuid',
    });
    expect(res.valid).toBe(false);
    expect(res.error).toContain('Only administrators can assign');
  });

  it('enforces min 3 character reason when admin rejects', () => {
    const validReject = validateTransition('SUBMITTED', 'REJECTED', adminActor, baseComplaint, {
      body: 'Duplicate of existing report #102',
    });
    expect(validReject.valid).toBe(true);

    const invalidReject = validateTransition('SUBMITTED', 'REJECTED', adminActor, baseComplaint, {
      body: 'no',
    });
    expect(invalidReject.valid).toBe(false);
    expect(invalidReject.error).toContain('at least 3 characters');
  });

  it('allows worker in assigned department to start work (ASSIGNED -> IN_PROGRESS)', () => {
    const res = validateTransition('ASSIGNED', 'IN_PROGRESS', roadsWorkerActor, baseComplaint, {});
    expect(res.valid).toBe(true);
  });

  it('denies worker from different department from starting work', () => {
    const res = validateTransition('ASSIGNED', 'IN_PROGRESS', waterWorkerActor, baseComplaint, {});
    expect(res.valid).toBe(false);
    expect(res.error).toContain('Worker must belong to the assigned department');
  });

  it('enforces resolution summary >= 10 chars when resolving IN_PROGRESS', () => {
    const activeJob = {
      ...baseComplaint,
      assignedWorkerId: roadsWorkerActor.id,
    };

    const validResolve = validateTransition('IN_PROGRESS', 'RESOLVED', roadsWorkerActor, activeJob, {
      resolutionSummary: 'Pothole filled with dense bitumen and compacted with roller',
    });
    expect(validResolve.valid).toBe(true);

    const invalidResolve = validateTransition('IN_PROGRESS', 'RESOLVED', roadsWorkerActor, activeJob, {
      resolutionSummary: 'done',
    });
    expect(invalidResolve.valid).toBe(false);
    expect(invalidResolve.error).toContain('at least 10 characters');
  });

  it('allows citizen to reopen resolved complaint within 30 days with >= 10 char reason', () => {
    const resolvedJob = {
      ...baseComplaint,
      resolvedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    };

    const validReopen = validateTransition('RESOLVED', 'REOPENED', citizenActor, resolvedJob, {
      body: 'Tar broke down again after heavy overnight rain',
    });
    expect(validReopen.valid).toBe(true);

    const shortReason = validateTransition('RESOLVED', 'REOPENED', citizenActor, resolvedJob, {
      body: 'bad',
    });
    expect(shortReason.valid).toBe(false);
    expect(shortReason.error).toContain('at least 10 characters');
  });

  it('denies reopening past 30 days', () => {
    const oldResolvedJob = {
      ...baseComplaint,
      resolvedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // 35 days ago
    };

    const res = validateTransition('RESOLVED', 'REOPENED', citizenActor, oldResolvedJob, {
      body: 'Problem came back after more than a month',
    });
    expect(res.valid).toBe(false);
    expect(res.error).toContain('within 30 days');
  });

  it('blocks illegal state transition (e.g. SUBMITTED directly to RESOLVED)', () => {
    const res = validateTransition('SUBMITTED', 'RESOLVED', roadsWorkerActor, baseComplaint, {
      resolutionSummary: 'Skipping steps',
    });
    expect(res.valid).toBe(false);
  });
});
