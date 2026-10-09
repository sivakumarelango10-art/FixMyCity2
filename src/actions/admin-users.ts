'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import crypto from 'crypto';

const CreateUserSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100),
  phone: z.string().trim().optional().or(z.literal('')),
  role: z.nativeEnum(Role),
  departmentId: z.string().uuid('Invalid department ID').optional().or(z.literal('')),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
});

const UpdateUserSchema = z.object({
  id: z.string().uuid('Invalid user ID'),
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100),
  phone: z.string().trim().optional().or(z.literal('')),
  role: z.nativeEnum(Role),
  departmentId: z.string().uuid('Invalid department ID').optional().or(z.literal('')),
  isActive: z.boolean(),
});

export async function adminCreateUser(input: z.infer<typeof CreateUserSchema>) {
  const admin = await requireRole('ADMIN');

  const parsed = CreateUserSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Validation error' };
  }

  const { email, fullName, phone, role, departmentId, password } = parsed.data;

  // If worker, department is required
  if (role === Role.WORKER && !departmentId) {
    return { success: false, error: 'Department assignment is required for municipal workers.' };
  }

  // Check if profile with email already exists in DB
  const existing = await prisma.profile.findUnique({
    where: { email },
  });
  if (existing) {
    return { success: false, error: `A user with email "${email}" already exists.` };
  }

  // Verify department exists if worker
  if (role === Role.WORKER && departmentId) {
    const dept = await prisma.department.findUnique({
      where: { id: departmentId },
    });
    if (!dept) {
      return { success: false, error: 'Selected department does not exist.' };
    }
  }

  let authUserId: string = crypto.randomUUID();

  // Try creating in Supabase Auth via Admin API
  try {
    const supabaseAdmin = createSupabaseAdminClient();
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: password || 'CivicSecure@2026!',
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role,
      },
    });

    if (authError) {
      // If user already exists in Supabase auth, find their ID
      if (authError.message.includes('already registered')) {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const found = listData.users.find((u) => u.email === email);
        if (found) {
          authUserId = found.id;
        }
      } else {
        console.warn('Supabase auth admin error (proceeding with DB profile):', authError.message);
      }
    } else if (authUser?.user) {
      authUserId = authUser.user.id;
    }
  } catch (err) {
    console.warn('Supabase admin client not initialized or network error, generating UUID:', err);
  }

  // Create Profile in Prisma DB
  const profile = await prisma.profile.create({
    data: {
      id: authUserId,
      email,
      fullName,
      phone: phone || null,
      role,
      departmentId: role === Role.WORKER ? departmentId || null : null,
      isActive: true,
    },
    include: {
      department: true,
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: 'CREATE_USER',
      entityType: 'PROFILE',
      entityId: profile.id,
      metadata: {
        email,
        role,
        departmentId: profile.departmentId,
        departmentName: profile.department?.name,
      },
    },
  });

  revalidatePath('/admin/users');
  revalidatePath('/admin');
  return { success: true, profile };
}

export async function adminUpdateUserRole(input: z.infer<typeof UpdateUserSchema>) {
  const admin = await requireRole('ADMIN');

  const parsed = UpdateUserSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Validation error' };
  }

  const { id, fullName, phone, role, departmentId, isActive } = parsed.data;

  const targetUser = await prisma.profile.findUnique({
    where: { id },
    include: { department: true },
  });
  if (!targetUser) {
    return { success: false, error: 'User not found.' };
  }

  // Guard: Admin cannot edit and change their own role or deactivate themselves
  if (targetUser.id === admin.id) {
    if (role !== Role.ADMIN) {
      return {
        success: false,
        error: 'Security restriction: An administrator cannot edit and change their own role.',
      };
    }
    if (!isActive) {
      return {
        success: false,
        error: 'Security restriction: You cannot deactivate your own administrator account.',
      };
    }
  }

  // Guard: Cannot remove last active admin
  if (targetUser.role === Role.ADMIN && (role !== Role.ADMIN || !isActive)) {
    const adminCount = await prisma.profile.count({
      where: { role: Role.ADMIN, isActive: true },
    });
    if (adminCount <= 1) {
      return {
        success: false,
        error: 'Cannot demote or deactivate the last remaining administrator in the system.',
      };
    }
  }

  // Guard: Worker requires a valid department
  if (role === Role.WORKER) {
    if (!departmentId) {
      return {
        success: false,
        error: 'Municipal workers must be assigned to an active municipal department.',
      };
    }
    const dept = await prisma.department.findUnique({
      where: { id: departmentId },
    });
    if (!dept) {
      return { success: false, error: 'Selected department does not exist.' };
    }
  }

  // If changing worker department, unassign from open tasks that belonged to the previous department
  if (
    targetUser.role === Role.WORKER &&
    departmentId &&
    targetUser.departmentId !== departmentId
  ) {
    await prisma.complaint.updateMany({
      where: {
        assignedWorkerId: targetUser.id,
        status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
      },
      data: {
        assignedWorkerId: null,
      },
    });
  }

  const updatedProfile = await prisma.profile.update({
    where: { id },
    data: {
      fullName,
      phone: phone || null,
      role,
      departmentId: role === Role.WORKER ? departmentId || null : null,
      isActive,
    },
    include: {
      department: true,
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: 'UPDATE_USER_ROLE',
      entityType: 'PROFILE',
      entityId: id,
      metadata: {
        before: {
          role: targetUser.role,
          departmentId: targetUser.departmentId,
          isActive: targetUser.isActive,
        },
        after: {
          role: updatedProfile.role,
          departmentId: updatedProfile.departmentId,
          isActive: updatedProfile.isActive,
        },
      },
    },
  });

  revalidatePath('/admin/users');
  revalidatePath('/admin');
  return { success: true, profile: updatedProfile };
}

export async function adminDeleteUser(id: string) {
  const admin = await requireRole('ADMIN');

  if (id === admin.id) {
    return { success: false, error: 'You cannot delete your own logged-in administrator account.' };
  }

  // Guard: Seeded primary admin protection
  if (id === '22222222-2222-4222-a222-222222222222') {
    return { success: false, error: 'The primary demo administrator account cannot be deleted.' };
  }

  const targetUser = await prisma.profile.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          complaints: true,
          bills: true,
          payments: true,
          assignedComplaints: true,
        },
      },
    },
  });

  if (!targetUser) {
    return { success: false, error: 'User not found.' };
  }

  // Check if foreign keys restrict deletion
  if (
    targetUser._count.complaints > 0 ||
    targetUser._count.bills > 0 ||
    targetUser._count.payments > 0
  ) {
    return {
      success: false,
      error: `Cannot delete "${targetUser.fullName}". This account has ${targetUser._count.complaints} complaint(s) and ${targetUser._count.bills} billing record(s). To preserve municipal records and audit integrity, please deactivate the user instead.`,
    };
  }

  // Unassign any assigned complaints if worker
  if (targetUser._count.assignedComplaints > 0) {
    await prisma.complaint.updateMany({
      where: { assignedWorkerId: id },
      data: { assignedWorkerId: null },
    });
  }

  // Delete notifications first to prevent foreign key errors
  await prisma.notification.deleteMany({
    where: { userId: id },
  });

  // Delete profile from DB
  await prisma.profile.delete({
    where: { id },
  });

  // Delete from Supabase Auth admin API if reachable
  try {
    const supabaseAdmin = createSupabaseAdminClient();
    await supabaseAdmin.auth.admin.deleteUser(id);
  } catch (err) {
    console.warn('Could not delete user from Supabase Auth admin (may already be deleted):', err);
  }

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: 'DELETE_USER',
      entityType: 'PROFILE',
      entityId: id,
      metadata: { email: targetUser.email, role: targetUser.role },
    },
  });

  revalidatePath('/admin/users');
  revalidatePath('/admin');
  return { success: true };
}
