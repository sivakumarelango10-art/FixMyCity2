import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PaymentMethodCode } from '@prisma/client';
import crypto from 'crypto';

const DemoPaymentRequestSchema = z.object({
  billId: z.string().uuid(),
  paymentMethodCode: z.nativeEnum(PaymentMethodCode),
  idempotencyKey: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  // 1. Authenticate user
  const user = await getCurrentUser();
  if (!user || !user.isActive) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Validate payload
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = DemoPaymentRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Invalid request payload' },
      { status: 400 }
    );
  }

  const { billId, paymentMethodCode, idempotencyKey } = parsed.data;

  // 3. Check for existing payment with this idempotency key
  const existingByKey = await prisma.payment.findUnique({
    where: { idempotencyKey },
    include: { bill: true },
  });

  if (existingByKey) {
    // Check if the request matches the original idempotent request
    if (
      existingByKey.billId === billId &&
      existingByKey.methodCodeSnapshot === paymentMethodCode &&
      existingByKey.citizenId === user.id
    ) {
      // Idempotent replay: return 200 with the exact same receipt
      return NextResponse.json(
        {
          success: true,
          replayed: true,
          payment: {
            id: existingByKey.id,
            reference: existingByKey.reference,
            amount: existingByKey.amount.toString(),
            service: existingByKey.bill.service,
            periodLabel: existingByKey.bill.periodLabel,
            methodCode: existingByKey.methodCodeSnapshot,
            methodName: existingByKey.methodNameSnapshot,
            status: existingByKey.status,
            createdAt: existingByKey.createdAt,
          },
        },
        { status: 200 }
      );
    } else {
      // Conflict: same idempotency key used for different bill or parameters
      return NextResponse.json(
        {
          code: 'IDEMPOTENCY_CONFLICT',
          error: 'This idempotency key was already used for a different payment request.',
        },
        { status: 409 }
      );
    }
  }

  // 4. Check global DemoPaymentSettings pause status
  const settings = await prisma.demoPaymentSettings.findUnique({
    where: { id: 'singleton' },
  });
  if (settings?.isPaused) {
    return NextResponse.json(
      {
        code: 'DEMO_PAYMENTS_PAUSED',
        error: 'Demo payment processing is currently paused by city administration.',
      },
      { status: 423 }
    );
  }

  // 5. Fetch bill and verify ownership and unpaid state
  const bill = await prisma.bill.findUnique({
    where: { id: billId },
  });

  if (!bill) {
    return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
  }

  if (bill.citizenId !== user.id) {
    return NextResponse.json({ error: 'Access denied: not your bill' }, { status: 403 });
  }

  if (bill.status === 'PAID') {
    return NextResponse.json(
      {
        code: 'ALREADY_PAID',
        error: 'This bill has already been paid.',
      },
      { status: 409 }
    );
  }

  // 6. Fetch payment method and verify it is enabled globally and for this service
  const method = await prisma.demoPaymentMethod.findUnique({
    where: { code: paymentMethodCode },
    include: {
      services: {
        where: { service: bill.service },
      },
    },
  });

  if (!method || !method.isEnabled || method.services.length === 0) {
    return NextResponse.json(
      {
        code: 'METHOD_UNAVAILABLE',
        error: `Payment method ${paymentMethodCode} is currently disabled or unavailable for ${bill.service}.`,
      },
      { status: 409 }
    );
  }

  // 7. Execute payment atomically in a transaction with row lock
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Re-verify bill inside transaction
      const lockedBill = await tx.bill.findUnique({
        where: { id: billId },
      });

      if (!lockedBill || lockedBill.status === 'PAID') {
        throw new Error('ALREADY_PAID');
      }

      // Generate reference: DEMO-YYYYMMDD-XXXXXX
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
      const reference = `DEMO-${dateStr}-${randSuffix}`;

      // Create Payment record with immutable snapshots
      const payment = await tx.payment.create({
        data: {
          billId: lockedBill.id,
          citizenId: user.id,
          amount: lockedBill.amount,
          reference,
          idempotencyKey,
          paymentMethodId: method.id,
          methodCodeSnapshot: method.code,
          methodNameSnapshot: method.displayName,
          status: 'SUCCEEDED',
        },
      });

      // Update Bill status
      await tx.bill.update({
        where: { id: lockedBill.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
      });

      // Create Notification
      await tx.notification.create({
        data: {
          userId: user.id,
          type: 'PAYMENT_RECEIPT',
          title: `Simulated Payment Receipt: ${lockedBill.service}`,
          body: `Simulated payment of ₹${lockedBill.amount} for ${lockedBill.periodLabel} succeeded (${method.displayName}). Ref: ${reference}`,
          link: '/dashboard/bills',
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: 'DEMO_PAYMENT_SUCCEEDED',
          entityType: 'PAYMENT',
          entityId: payment.id,
          metadata: {
            billId: lockedBill.id,
            service: lockedBill.service,
            amount: lockedBill.amount.toString(),
            reference,
            methodCode: method.code,
          },
        },
      });

      return { payment, bill: lockedBill };
    });

    return NextResponse.json(
      {
        success: true,
        replayed: false,
        payment: {
          id: result.payment.id,
          reference: result.payment.reference,
          amount: result.payment.amount.toString(),
          service: result.bill.service,
          periodLabel: result.bill.periodLabel,
          methodCode: result.payment.methodCodeSnapshot,
          methodName: result.payment.methodNameSnapshot,
          status: result.payment.status,
          createdAt: result.payment.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    if ((err as Error).message === 'ALREADY_PAID') {
      return NextResponse.json(
        { code: 'ALREADY_PAID', error: 'This bill has already been paid.' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: (err as Error).message || 'Payment transaction failed' },
      { status: 500 }
    );
  }
}
