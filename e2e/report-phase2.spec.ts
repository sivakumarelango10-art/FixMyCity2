import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Phase 2: Citizen Report Wizard, Photos, AI & Tracking', () => {
  test('citizen submits a pothole complaint end-to-end with evidence photo and map pin', async ({ page }) => {
    // 1. Log in as Citizen Demo
    await page.goto('/login');
    await page.click('button:has-text("Try Citizen Demo")');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // 2. Navigate to Report Grievance
    await page.goto('/dashboard/report');
    await expect(page.locator('h1')).toContainText('Report a Problem in Your City');

    // 3. Step 1: Details
    await page.fill('input#title', 'Hazardous deep pothole near Indiranagar 100ft road junction');
    await page.fill(
      'textarea#description',
      'Massive crater on asphalt road surface causing severe hazard of bike skid and vehicle rim damage during evening rush hour.'
    );

    // Click continue to Step 2
    await page.click('button:has-text("Continue to Category")');

    // 4. Step 2: Category & AI
    await expect(page.locator('text=Step 2: Department Category')).toBeVisible();
    await expect(page.locator('text=Roads & Infrastructure Department').first()).toBeVisible();

    // Click continue to Step 3
    await page.click('button:has-text("Continue to Photos")');

    // 5. Step 3: Evidence Photos
    await expect(page.locator('text=Step 3: Evidence Photos')).toBeVisible();

    // Attach real test image
    const fixturePath = path.resolve('tests/fixtures/test-pothole.png');
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('text=Select Photo');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(fixturePath);

    // Wait for photo preview to render
    await expect(page.locator('img[alt^="Evidence"]').first()).toBeVisible({ timeout: 15000 });

    // Click continue to Step 4
    await page.click('button:has-text("Continue to Location")');

    // 6. Step 4: Location & Review
    await expect(page.locator('text=Step 4: Location & Review')).toBeVisible();
    await expect(page.locator('text=Pin Incident Location on Map')).toBeVisible();
    await expect(page.locator('input#address')).toHaveValue(/Bengaluru/);

    // Submit final report
    await page.click('button:has-text("Submit Official Report")');

    // 7. Verify Success Screen with FMC-2026-######
    await expect(page.locator('text=Complaint Registered')).toBeVisible({ timeout: 15000 });
    const trackingLocator = page.locator('span.font-mono.text-2xl');
    await expect(trackingLocator).toBeVisible();
    const trackingNumber = await trackingLocator.innerText();
    expect(trackingNumber).toMatch(/^FMC-2026-\d{6}$/);

    // 8. Click "Track This Issue Now" and verify detail page
    await page.click('text=Track This Issue Now');
    await expect(page).toHaveURL(/\/dashboard\/complaints\/[a-f0-9-]+/);

    // Verify detail page elements
    await expect(page.locator(`text=${trackingNumber}`).first()).toBeVisible();
    await expect(page.locator('h1').filter({ hasText: 'Hazardous deep pothole near Indiranagar 100ft road junction' })).toBeVisible();
    await expect(page.locator('text=Submitted').first()).toBeVisible();
    await expect(page.locator('text=Evidence Photos (1)')).toBeVisible();
    await expect(page.locator('img[alt="Evidence photo 1"]')).toBeVisible();
  });

  test('unauthenticated visitor cannot view private complaint detail', async ({ page }) => {
    // Attempt to access complaint detail without session
    await page.goto('/dashboard/complaints/00000000-0000-0000-0000-000000000000');
    await expect(page).toHaveURL(/\/login/);
  });
});
