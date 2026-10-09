import { describe, it, expect } from 'vitest';
import { adminCreateBill, adminApprovePayment } from '@/actions/admin-bills';
import { BillService } from '@prisma/client';

describe('Admin Billing & Payment Approval Guards', () => {
  it('denies unauthenticated callers from creating citizen bills', async () => {
    await expect(
      adminCreateBill({
        citizenId: '11111111-1111-4111-a111-111111111111',
        service: BillService.ELECTRICITY,
        periodLabel: 'April 2026',
        amount: 1500,
        dueDate: '2026-05-15',
      })
    ).rejects.toThrow();
  });

  it('denies unauthenticated callers from approving payments', async () => {
    await expect(
      adminApprovePayment({
        paymentId: '11111111-2222-3333-4444-555555555555',
      })
    ).rejects.toThrow();
  });
});
