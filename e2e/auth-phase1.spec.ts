import { test, expect } from '@playwright/test';

test.describe('Phase 1: Authentication, Role Portals, and One-Click Demo Logins', () => {
  test('unauthenticated visitor to /dashboard is redirected to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('h1')).toContainText('Welcome to FixMyCity');
  });

  test('wrong password login shows accessible error feedback', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input#email', 'citizen@demo.fixmycity.app');
    await page.fill('input#password', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    const alert = page.locator('[data-testid="error-alert"]');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/Email or password is incorrect|Invalid login credentials/i);
  });

  test('one-click Try Citizen Demo logs in, shows Citizen Portal and persists on reload', async ({ page }) => {
    await page.goto('/login');

    // Click Try Citizen Demo
    await page.click('button:has-text("Try Citizen Demo")');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // Verify Citizen Portal branding and demo banner
    await expect(page.locator('text=Citizen Portal').first()).toBeVisible();
    await expect(page.locator('text=DEMO ENVIRONMENT — SAMPLE DATA')).toBeVisible();
    await expect(page.locator('h1').filter({ hasText: 'Ravi Kumar' })).toBeVisible();

    // Verify session persistence after page reload
    await page.reload();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('text=Citizen Portal').first()).toBeVisible();

    // Verify Citizen cannot access /admin (redirects back to /dashboard)
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/dashboard/);

    // Sign out via demo banner button
    await page.click('button:has-text("Sign Out / Switch Role")');
    await expect(page).toHaveURL(/\/login/);
  });

  test('one-click Try Admin Demo logs in, shows Admin Console', async ({ page }) => {
    await page.goto('/login');

    // Click Try Admin Demo
    await page.click('button:has-text("Try Admin Demo")');
    await expect(page).toHaveURL(/\/admin/, { timeout: 15000 });

    // Verify Admin Portal branding and operations sidebar
    await expect(page.locator('text=Operations Console')).toBeVisible();
    await expect(page.locator('text=Municipal Pipeline Overview')).toBeVisible();
    await expect(page.locator('text=DEMO ENVIRONMENT — SAMPLE DATA')).toBeVisible();

    // Sign out via demo banner button
    await page.click('button:has-text("Sign Out / Switch Role")');
    await expect(page).toHaveURL(/\/login/);
  });

  test('one-click Try Worker Demo logs in, shows Worker Portal and department badge', async ({ page }) => {
    await page.goto('/login');

    // Click Try Worker Demo
    await page.click('button:has-text("Try Worker Demo")');
    await expect(page).toHaveURL(/\/worker/, { timeout: 15000 });

    // Verify Worker Portal branding and department badge
    await expect(page.locator('text=Field Operations Console')).toBeVisible();
    await expect(page.locator('text=Roads & Infrastructure Department').first()).toBeVisible();
    await expect(page.locator('text=DEMO ENVIRONMENT — SAMPLE DATA')).toBeVisible();

    // Verify Worker cannot access /admin (redirects to /worker)
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/worker/);

    // Sign out via demo banner button
    await page.click('button:has-text("Sign Out / Switch Role")');
    await expect(page).toHaveURL(/\/login/);
  });
});
