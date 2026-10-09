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
    await expect(
      adminCreateDepartment({
        name: 'Forests Division',
        code: 'FOREST',
        description: 'Forest reserve maintenance and tree planting',
        isActive: true,
      })
    ).rejects.toThrow();
  });

  it('denies unauthenticated callers from deleting a department', async () => {
    await expect(
      adminDeleteDepartment('11111111-2222-3333-4444-555555555555')
    ).rejects.toThrow();
  });

  it('denies unauthenticated callers from creating a user/worker', async () => {
    await expect(
      adminCreateUser({
        email: 'new.worker@fixmycity.app',
        fullName: 'New Worker',
        role: 'WORKER',
        departmentId: '11111111-2222-3333-4444-555555555555',
      })
    ).rejects.toThrow();
  });

  it('denies unauthenticated callers from deleting a user', async () => {
    await expect(
      adminDeleteUser('11111111-2222-3333-4444-555555555555')
    ).rejects.toThrow();
  });
});
