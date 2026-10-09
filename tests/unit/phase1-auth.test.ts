import { describe, it, expect } from 'vitest';
import { getRoleHome, isAuthorizedForRole, sanitizeRedirectPath } from '@/lib/permissions';

describe('Phase 1 Auth & Permissions Unit Tests', () => {
  it('correctly returns canonical role homes for each role', () => {
    expect(getRoleHome('CITIZEN')).toBe('/dashboard');
    expect(getRoleHome('ADMIN')).toBe('/admin');
    expect(getRoleHome('WORKER')).toBe('/worker');
  });

  it('correctly validates role permissions', () => {
    expect(isAuthorizedForRole('CITIZEN', ['CITIZEN'])).toBe(true);
    expect(isAuthorizedForRole('CITIZEN', ['ADMIN', 'WORKER'])).toBe(false);
    expect(isAuthorizedForRole('ADMIN', ['ADMIN'])).toBe(true);
    expect(isAuthorizedForRole('WORKER', ['WORKER'])).toBe(true);
  });

  it('sanitizes redirect paths and blocks open redirect attacks', () => {
    // Relative paths allowed
    expect(sanitizeRedirectPath('/dashboard/report', 'CITIZEN')).toBe('/dashboard/report');
    expect(sanitizeRedirectPath('/admin/complaints', 'ADMIN')).toBe('/admin/complaints');

    // Protocol-relative open redirects blocked
    expect(sanitizeRedirectPath('//evil.com', 'CITIZEN')).toBe('/dashboard');
    expect(sanitizeRedirectPath('https://evil.com', 'CITIZEN')).toBe('/dashboard');

    // Login/Register loops blocked
    expect(sanitizeRedirectPath('/login', 'CITIZEN')).toBe('/dashboard');
    expect(sanitizeRedirectPath('/register', 'ADMIN')).toBe('/admin');
    expect(sanitizeRedirectPath('/auth/redirect', 'WORKER')).toBe('/worker');

    // Null/undefined defaults to role home
    expect(sanitizeRedirectPath(null, 'CITIZEN')).toBe('/dashboard');
    expect(sanitizeRedirectPath(undefined, 'WORKER')).toBe('/worker');
  });
});
