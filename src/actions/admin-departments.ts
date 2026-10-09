'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';

const CreateDepartmentSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  code: z
    .string()
    .trim()
    .min(2, 'Code must be at least 2 characters')
    .max(50)
    .regex(/^[A-Z0-9_]+$/, 'Code must contain only uppercase letters, numbers, and underscores'),
  description: z.string().trim().min(5, 'Description must be at least 5 characters').max(500),
  contactEmail: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
  isActive: z.boolean().default(true),
});

const UpdateDepartmentSchema = CreateDepartmentSchema.extend({
  id: z.string().uuid('Invalid department ID'),
});

export async function adminCreateDepartment(input: z.infer<typeof CreateDepartmentSchema>) {
  const admin = await requireRole('ADMIN');

  const parsed = CreateDepartmentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Validation error' };
  }

  const { name, code, description, contactEmail, isActive } = parsed.data;

  // Check unique code
  const existing = await prisma.department.findUnique({
    where: { code },
  });
  if (existing) {
    return { success: false, error: `A department with code "${code}" already exists.` };
  }

  const department = await prisma.department.create({
    data: {
      name,
      code,
      description,
      contactEmail: contactEmail || null,
      isActive,
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: 'CREATE_DEPARTMENT',
      entityType: 'DEPARTMENT',
      entityId: department.id,
      metadata: { code, name, isActive },
    },
  });

  revalidatePath('/admin/departments');
  revalidatePath('/admin');
  return { success: true, department };
}

export async function adminUpdateDepartment(input: z.infer<typeof UpdateDepartmentSchema>) {
  const admin = await requireRole('ADMIN');

  const parsed = UpdateDepartmentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Validation error' };
  }

  const { id, name, code, description, contactEmail, isActive } = parsed.data;

  const department = await prisma.department.findUnique({
    where: { id },
  });
  if (!department) {
    return { success: false, error: 'Department not found.' };
  }

  // Check unique code if changed
  if (code !== department.code) {
    const existing = await prisma.department.findUnique({
      where: { code },
    });
    if (existing) {
      return { success: false, error: `A department with code "${code}" already exists.` };
    }
  }

  const updated = await prisma.department.update({
    where: { id },
    data: {
      name,
      code,
      description,
      contactEmail: contactEmail || null,
      isActive,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: 'UPDATE_DEPARTMENT',
      entityType: 'DEPARTMENT',
      entityId: department.id,
      metadata: {
        before: { code: department.code, name: department.name, isActive: department.isActive },
        after: { code, name, isActive },
      },
    },
  });

  revalidatePath('/admin/departments');
  revalidatePath('/admin');
  return { success: true, department: updated };
}

export async function adminDeleteDepartment(id: string) {
  const admin = await requireRole('ADMIN');

  const department = await prisma.department.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          complaints: true,
          profiles: true,
        },
      },
    },
  });

  if (!department) {
    return { success: false, error: 'Department not found.' };
  }

  // Prevent breaking assignments if complaints or profiles are linked
  if (department._count.complaints > 0 || department._count.profiles > 0) {
    return {
      success: false,
      error: `Cannot delete "${department.name}". It is currently linked to ${department._count.complaints} complaint(s) and ${department._count.profiles} staff member(s). Please deactivate the department or reassign its records first.`,
    };
  }

  await prisma.department.delete({
    where: { id },
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: 'DELETE_DEPARTMENT',
      entityType: 'DEPARTMENT',
      entityId: id,
      metadata: { name: department.name, code: department.code },
    },
  });

  revalidatePath('/admin/departments');
  revalidatePath('/admin');
  return { success: true };
}

export async function adminToggleDepartmentActive(id: string, isActive: boolean) {
  const admin = await requireRole('ADMIN');

  const department = await prisma.department.findUnique({
    where: { id },
  });
  if (!department) {
    return { success: false, error: 'Department not found.' };
  }

  const updated = await prisma.department.update({
    where: { id },
    data: { isActive },
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: isActive ? 'ACTIVATE_DEPARTMENT' : 'DEACTIVATE_DEPARTMENT',
      entityType: 'DEPARTMENT',
      entityId: id,
      metadata: { name: department.name, code: department.code, isActive },
    },
  });

  revalidatePath('/admin/departments');
  revalidatePath('/admin');
  return { success: true, department: updated };
}
