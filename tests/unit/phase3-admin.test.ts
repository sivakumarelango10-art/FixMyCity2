import { describe, it, expect } from 'vitest';
import {
  adminAssignComplaint,
  adminReviewComplaint,
  adminRejectComplaint,
  adminAddNote,
} from '@/actions/admin-complaints';
import {
  adminUpdatePaymentMethod,
  adminTogglePaymentMethodEnabled,
  adminToggleGlobalPaymentPause,
} from '@/actions/admin-payment-methods';

describe('Phase 3: Admin Operations & Role Boundaries', () => {
  it('strictly denies non-authenticated callers from admin complaint actions', async () => {
    await expect(
      adminAssignComplaint({
        complaintId: '00000000-0000-0000-0000-000000000000',
        departmentId: '00000000-0000-0000-0000-000000000000',
      })
    ).rejects.toThrow();

    await expect(
      adminReviewComplaint('00000000-0000-0000-0000-000000000000')
    ).rejects.toThrow();

    await expect(
      adminRejectComplaint('00000000-0000-0000-0000-000000000000', 'Rejected reason')
    ).rejects.toThrow();

    await expect(
      adminAddNote('00000000-0000-0000-0000-000000000000', 'Test internal note')
    ).rejects.toThrow();
  });

  it('strictly denies non-admin callers from modifying payment method settings', async () => {
    await expect(
      adminUpdatePaymentMethod({
        methodId: '00000000-0000-0000-0000-000000000000',
        displayName: 'Hacked UPI',
        isEnabled: true,
        sortOrder: 0,
        allowedServices: ['ELECTRICITY'],
      })
    ).rejects.toThrow();

    await expect(
      adminTogglePaymentMethodEnabled('00000000-0000-0000-0000-000000000000', false)
    ).rejects.toThrow();

    await expect(
      adminToggleGlobalPaymentPause(true)
    ).rejects.toThrow();
  });
});
