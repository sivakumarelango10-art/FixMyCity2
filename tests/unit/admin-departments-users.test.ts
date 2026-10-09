import { describe, it, expect } from 'vitest';
import {
  adminCreateDepartment,
  adminDeleteDepartment,
} from '@/actions/admin-departments';
import {
  adminCreateUser,
  adminDeleteUser,
} from '@/actions/admin-users';

describe('Admin Department & User Management Guards', () => {
  it('denies unauthenticated callers from creating a department', async () => {
    const res = await adminCreateDepartment({
      name: 'Forests Division',
      code: 'FOREST',
      description: 'Forest reserve maintenance and tree planting',
      isActive: true,
    });
    expect(res.success).toBe(false);
  });

  it('denies unauthenticated callers from deleting a department', async () => {
    const res = await adminDeleteDepartment('11111111-2222-3333-4444-555555555555');
    expect(res.success).toBe(false);
  });

  it('denies unauthenticated callers from creating a user/worker', async () => {
    const res = await adminCreateUser({
      email: 'new.worker@fixmycity.app',
      fullName: 'New Worker',
      role: 'WORKER',
      departmentId: '11111111-2222-3333-4444-555555555555',
    });
    expect(res.success).toBe(false);
  });

  it('denies unauthenticated callers from deleting a user', async () => {
    const res = await adminDeleteUser('11111111-2222-3333-4444-555555555555');
    expect(res.success).toBe(false);
  });
});
