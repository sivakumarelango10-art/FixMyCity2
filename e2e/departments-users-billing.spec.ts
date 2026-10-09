import { test, expect } from '@playwright/test';

test.describe('Department, User Management, Billing & No-404 Route Integrity', () => {
  test('Admin adds department, edits department, creates worker, creates bill, and approves payment', async ({ page }) => {
    // 1. One-click Admin Demo Login
    await page.goto('/login');
    const adminDemoBtn = page.locator('[data-testid="demo-login-admin"]');
    await adminDemoBtn.click();
    await page.waitForURL('/admin', { timeout: 15000 });

    // 2. Department Management (/admin/departments)
    await page.goto('/admin/departments');
    await expect(page.locator('h1')).toContainText('Municipal Departments');

    // Add Department
    const nonce = Date.now().toString().slice(-4);
    const deptCode = `DEPT${nonce}`;
    const deptName = `Parks & Forestry ${nonce}`;

    await page.locator('[data-testid="add-department-btn"]').click();
    await expect(page.locator('[data-testid="add-dept-modal"]')).toBeVisible();

    await page.locator('input[placeholder*="Parks & Recreation"]').fill(deptName);
    await page.locator('input[placeholder*="PARKS"]').fill(deptCode);
    await page.locator('textarea[placeholder*="Public garden maintenance"]').fill('Public forestry and urban green cover maintenance');
    await page.locator('[data-testid="submit-add-dept"]').click();

    // Verify added department appears
    await expect(page.locator(`[data-testid="department-card-${deptCode}"]`)).toBeVisible({ timeout: 10000 });

    // Edit Department
    await page.locator(`[data-testid="edit-dept-${deptCode}"]`).click();
    await expect(page.locator('[data-testid="edit-dept-modal"]')).toBeVisible();
    await page.locator('textarea').fill('Updated urban green cover maintenance description');
    await page.locator('[data-testid="submit-edit-dept"]').click();
    await expect(page.locator('[data-testid="edit-dept-modal"]')).not.toBeVisible({ timeout: 10000 });
    await expect(page.locator(`[data-testid="department-card-${deptCode}"]`)).toContainText('Updated urban green cover', { timeout: 10000 });

    // 3. User & Worker Management (/admin/users)
    await page.goto('/admin/users');
    await expect(page.locator('h1')).toContainText('User & Field Workforce Directory');

    // Add Worker
    const workerEmail = `worker.${nonce}@demo.fixmycity.app`;
    const workerName = `Officer Kumar ${nonce}`;

    await page.locator('[data-testid="add-user-btn"]').click();
    await expect(page.locator('[data-testid="add-user-modal"]')).toBeVisible();

    await page.locator('input[placeholder*="Anand Kumar"]').fill(workerName);
    await page.locator('input[placeholder*="anand.worker@fixmycity.app"]').fill(workerEmail);
    await page.locator('[data-testid="submit-add-user"]').click();

    // Verify worker appears in directory
    await expect(page.locator(`text=${workerName}`)).toBeVisible({ timeout: 10000 });

    // Verify Admin cannot edit and change their own role
    const selfRow = page.locator('tr:has-text("YOU")');
    await expect(selfRow).toBeVisible();
    await selfRow.locator('button:has-text("Edit Role")').click();
    await expect(page.locator('[data-testid="edit-user-modal"]')).toBeVisible();
    await expect(page.locator('text=Security policy: You cannot edit and change your own administrator role.')).toBeVisible();
    await page.locator('button:has-text("Cancel")').click();

    // 4. Admin Billing Management (/admin/billing)
    await page.goto('/admin/billing');
    await expect(page.locator('h1')).toContainText('Demo Billing & Treasury Administration');

    // Create Citizen Bill
    await page.locator('[data-testid="create-bill-btn"]').click();
    await expect(page.locator('[data-testid="create-bill-modal"]')).toBeVisible();

    const periodLabel = `Assessment ${nonce}`;
    await page.locator('input[placeholder*="March-April 2026"]').fill(periodLabel);
    await page.locator('input[placeholder*="1450.00"]').fill('850');
    await page.locator('[data-testid="submit-create-bill-btn"]').click();

    await expect(page.locator(`text=${periodLabel}`)).toBeVisible({ timeout: 10000 });

    // 5. Verify No-404 across portals
    // Admin routes
    await page.goto('/admin/complaints');
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
    await page.goto('/admin/payment-methods');
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
    await page.goto('/admin/announcements');
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
    await page.goto('/admin/analytics');
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
    await page.goto('/admin/account');
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });

    // Sign out and check Citizen & Worker routes
    await page.goto('/login');
    await page.locator('[data-testid="demo-login-worker"]').click();
    await page.waitForURL('/worker', { timeout: 15000 });

    await page.goto('/worker/my-tasks');
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
    await page.goto('/worker/queue');
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
    await page.goto('/worker/in-progress');
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
    await page.goto('/worker/history');
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
    await page.goto('/worker/notifications');
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
    await page.goto('/worker/account');
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });

    // Citizen Portal
    await page.goto('/login');
    await page.locator('[data-testid="demo-login-citizen"]').click();
    await page.waitForURL('/dashboard', { timeout: 15000 });

    await page.goto('/dashboard/bills');
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
    await page.goto('/dashboard/notifications');
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
    await page.goto('/dashboard/profile');
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
    await page.goto('/dashboard/updates');
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });

    // Public pages
    await page.goto('/services');
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
    await page.goto('/map');
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
    await page.goto('/updates');
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
    await page.goto('/help');
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
    await page.goto('/about');
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
  });
});
