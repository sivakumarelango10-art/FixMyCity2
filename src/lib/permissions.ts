import { Role } from '@/types/enums';

export const ROLE_HOMES: Record<Role, string> = {
  CITIZEN: '/dashboard',
  ADMIN: '/admin',
  WORKER: '/worker',
};

export function getRoleHome(role: Role): string {
  return ROLE_HOMES[role] || '/dashboard';
}

export function isAuthorizedForRole(userRole: Role, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(userRole);
}

export function sanitizeRedirectPath(path: string | null | undefined, userRole?: Role): string {
  if (!path || typeof path !== 'string') {
    return userRole ? getRoleHome(userRole) : '/dashboard';
  }

  // Ensure it's a relative path starting with / and not // (protocol-relative)
  if (!path.startsWith('/') || path.startsWith('//')) {
    return userRole ? getRoleHome(userRole) : '/dashboard';
  }

  // Prevent redirect loops
  if (path.startsWith('/login') || path.startsWith('/register') || path.startsWith('/auth/')) {
    return userRole ? getRoleHome(userRole) : '/dashboard';
  }

  return path;
}
