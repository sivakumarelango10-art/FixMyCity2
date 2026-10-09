import { test, expect } from '@playwright/test';

test.describe('Phase 3: Admin Operations, Triage, Notes & Payment Settings', () => {
  test('admin reviews complaint, posts public & internal notes, and configures payment methods', async ({ page }) => {
    // 1. Log in as Admin Demo
    await page.goto('/login');
    await page.click('button:has-text("Try Admin Demo")');
    await expect(page).toHaveURL(/\/admin/, { timeout: 15000 });

    // 2. Open Grievance Queue
    await page.goto('/admin/complaints');
    await expect(page.locator('h1')).toContainText('Grievance Dispatch Queue');

    // Click first complaint's Triage button
    const triageButton = page.locator('a:has-text("Triage")').first();
    await expect(triageButton).toBeVisible();
    await Promise.all([
      page.waitForURL(/\/admin\/complaints\/[a-f0-9-]+/, { timeout: 15000 }),
      triageButton.click(),
    ]);

    const nonce = Date.now();
    const internalNote = `INTERNAL_CONFIDENTIAL_NOTE_${nonce}`;
    const publicNote = `PUBLIC_MUNICIPAL_UPDATE_${nonce}`;

    // 3. Post an INTERNAL note (Staff only)
    await page.click('label:has-text("Internal (Staff Only)")');
    await page.fill('[data-testid="admin-note-textarea"]', internalNote);
    await page.click('[data-testid="post-note-btn"]');
    await expect(page.locator(`p:has-text("${internalNote}")`).first()).toBeVisible({ timeout: 15000 });

    // 4. Post a PUBLIC note (Citizen visible)
    await page.click('label:has-text("Public (Citizen Sees)")');
    await page.fill('[data-testid="admin-note-textarea"]', publicNote);
    await page.click('[data-testid="post-note-btn"]');
    await expect(page.locator(`p:has-text("${publicNote}")`).first()).toBeVisible({ timeout: 15000 });

    // Get complaint ID from URL
    const complaintUrl = page.url();
    const complaintId = complaintUrl.split('/admin/complaints/')[1];

    // 5. Visit Admin Payment Methods settings
    await page.goto('/admin/payment-methods');
    await expect(page.locator('h2')).toContainText('Admin-Configurable Demo Payment Methods');
    await expect(page.locator('text=Simulation Only').first()).toBeVisible();
    await expect(page.locator('text=DEMO_UPI')).toBeVisible();
    await expect(page.locator('text=DEMO_CARD')).toBeVisible();
    await expect(page.locator('text=DEMO_NET_BANKING')).toBeVisible();
    await expect(page.locator('text=Citizen Checkout Preview')).toBeVisible();

    // Sign out from Admin session
    await page.click('button:has-text("Sign Out / Switch Role")');
    await expect(page).toHaveURL(/\/login/);

    // 6. Log in as Citizen Demo and check notes visibility
    await page.click('button:has-text("Try Citizen Demo")');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // Visit citizen complaint detail page
    await page.goto(`/dashboard/complaints/${complaintId}`);

    // PUBLIC note must be visible in citizen timeline
    await expect(page.locator(`p:has-text("${publicNote}")`).first()).toBeVisible();

    // INTERNAL note must be strictly ABSENT from citizen DOM
    await expect(page.locator(`text=${internalNote}`)).toHaveCount(0);

    // 7. Verify Citizen cannot access admin payment settings (redirected to /dashboard)
    await page.goto('/admin/payment-methods');
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
