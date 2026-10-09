'use server';

import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { BillService } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const updateMethodSchema = z.object({
  methodId: z.string().uuid(),
  displayName: z.string().min(2).max(60),
  description: z.string().max(200).optional(),
  isEnabled: z.boolean(),
  sortOrder: z.number().int().min(0).max(100),
  allowedServices: z.array(z.nativeEnum(BillService)),
  defaultServices: z.array(z.nativeEnum(BillService)).optional(),
});

export async function adminUpdatePaymentMethod(data: z.infer<typeof updateMethodSchema>) {
  const admin = await requireRole('ADMIN');
  const parsed = updateMethodSchema.parse(data);

  const existing = await prisma.demoPaymentMethod.findUnique({
    where: { id: parsed.methodId },
    include: { services: true },
  });

  if (!existing) {
    throw new Error('Demo payment method not found');
  }

  // Transactionally update method and its service joins
  const updated = await prisma.$transaction(async (tx) => {
    // 1. Update master record
    const m = await tx.demoPaymentMethod.update({
      where: { id: parsed.methodId },
      data: {
        displayName: parsed.displayName.trim(),
        description: parsed.description ? parsed.description.trim() : null,
        isEnabled: parsed.isEnabled,
        sortOrder: parsed.sortOrder,
        updatedById: admin.id,
      },
    });

    // 2. Delete existing service links
    await tx.demoPaymentMethodService.deleteMany({
      where: { paymentMethodId: parsed.methodId },
    });

    // 3. Re-create service links
    if (parsed.allowedServices.length > 0) {
      for (const s of parsed.allowedServices) {
        const isDefault = parsed.defaultServices?.includes(s) || false;

        // If this method is set as default for service s, unset any previous default
        if (isDefault) {
          await tx.demoPaymentMethodService.updateMany({
            where: { service: s, isDefault: true },
            data: { isDefault: false },
          });
        }

        await tx.demoPaymentMethodService.create({
          data: {
            paymentMethodId: parsed.methodId,
            service: s,
            isDefault,
          },
        });
      }
    }

    // 4. Audit log
    await tx.auditLog.create({
      data: {
        actorId: admin.id,
        action: 'UPDATE_DEMO_PAYMENT_METHOD',
        entityType: 'PAYMENT_METHOD',
        entityId: m.id,
        metadata: {
          code: m.code,
          displayName: m.displayName,
          isEnabled: m.isEnabled,
          allowedServices: parsed.allowedServices,
        },
      },
    });

    return m;
  });

  revalidatePath('/admin/payment-methods');
  revalidatePath('/admin/billing');
  revalidatePath('/dashboard/bills');

  return { success: true, method: updated };
}

export async function adminTogglePaymentMethodEnabled(methodId: string, isEnabled: boolean) {
  const admin = await requireRole('ADMIN');

  const m = await prisma.demoPaymentMethod.update({
    where: { id: methodId },
    data: {
      isEnabled,
      updatedById: admin.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: isEnabled ? 'ENABLE_DEMO_PAYMENT_METHOD' : 'DISABLE_DEMO_PAYMENT_METHOD',
      entityType: 'PAYMENT_METHOD',
      entityId: methodId,
      metadata: { code: m.code, isEnabled },
    },
  });

  revalidatePath('/admin/payment-methods');
  revalidatePath('/dashboard/bills');

  return { success: true, isEnabled: m.isEnabled };
}

export async function adminToggleGlobalPaymentPause(isPaused: boolean) {
  const admin = await requireRole('ADMIN');

  const settings = await prisma.demoPaymentSettings.upsert({
    where: { id: 'singleton' },
    update: {
      isPaused,
      updatedById: admin.id,
    },
    create: {
      id: 'singleton',
      isPaused,
      updatedById: admin.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: isPaused ? 'PAUSE_DEMO_PAYMENTS' : 'RESUME_DEMO_PAYMENTS',
      entityType: 'PAYMENT_SETTINGS',
      entityId: settings.id,
      metadata: { isPaused },
    },
  });

  revalidatePath('/admin/payment-methods');
  revalidatePath('/dashboard/bills');

  return { success: true, isPaused: settings.isPaused };
}
