'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { BillService } from '@prisma/client';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';

const CreateBillSchema = z.object({
  citizenId: z.string().uuid('Invalid citizen ID'),
  service: z.nativeEnum(BillService),
  periodLabel: z.string().trim().min(2, 'Period label must be at least 2 characters').max(60),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  dueDate: z.string().or(z.date()),
});

const ApprovePaymentSchema = z.object({
  paymentId: z.string().uuid('Invalid payment ID'),
});

export async function adminCreateBill(input: z.infer<typeof CreateBillSchema>) {
  const admin = await requireRole('ADMIN');

  const parsed = CreateBillSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Validation error' };
  }

  const { citizenId, service, periodLabel, amount, dueDate } = parsed.data;

  // Check citizen exists
  const citizen = await prisma.profile.findUnique({
    where: { id: citizenId },
  });
  if (!citizen) {
    return { success: false, error: 'Selected citizen not found.' };
  }

  const bill = await prisma.bill.create({
    data: {
      citizenId,
      service,
      periodLabel,
      amount,
      dueDate: new Date(dueDate),
      status: 'UNPAID',
      isDemo: true,
    },
  });

  // Notify citizen
  await prisma.notification.create({
    data: {
      userId: citizenId,
      type: 'BILL_ISSUED',
      title: `New Municipal Bill Issued: ${service.replace('_', ' ')}`,
      body: `A simulated bill of ₹${amount} for ${periodLabel} has been generated. Due date: ${new Date(dueDate).toLocaleDateString('en-IN')}`,
      link: '/dashboard/bills',
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: 'ADMIN_CREATE_BILL',
      entityType: 'BILL',
      entityId: bill.id,
      metadata: {
        citizenId,
        citizenName: citizen.fullName,
        service,
        amount,
        periodLabel,
      },
    },
  });

  revalidatePath('/admin/billing');
  revalidatePath('/dashboard/bills');
  revalidatePath('/dashboard');
  return { success: true, bill };
}

export async function adminApprovePayment(input: z.infer<typeof ApprovePaymentSchema>) {
  const admin = await requireRole('ADMIN');

  const parsed = ApprovePaymentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid payment ID' };
  }

  const { paymentId } = parsed.data;

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { bill: true, citizen: true },
  });

  if (!payment) {
    return { success: false, error: 'Payment receipt not found.' };
  }

  if (payment.isApproved) {
    return { success: false, error: 'Payment has already been approved by an administrator.' };
  }

  const updated = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      isApproved: true,
      approvedAt: new Date(),
      approvedById: admin.id,
    },
  });

  // Notify citizen of admin approval
  await prisma.notification.create({
    data: {
      userId: payment.citizenId,
      type: 'PAYMENT_APPROVED',
      title: `Payment Approved by Treasury: ${payment.bill.service}`,
      body: `Your payment of ₹${payment.amount} (Ref: ${payment.reference}) has been officially reconciled and approved by the municipal administration.`,
      link: '/dashboard/bills',
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: 'ADMIN_APPROVE_PAYMENT',
      entityType: 'PAYMENT',
      entityId: payment.id,
      metadata: {
        reference: payment.reference,
        amount: payment.amount.toString(),
        citizenId: payment.citizenId,
        citizenName: payment.citizen.fullName,
        approvedAt: updated.approvedAt,
      },
    },
  });

  revalidatePath('/admin/billing');
  revalidatePath('/dashboard/bills');
  return { success: true, payment: updated };
}
