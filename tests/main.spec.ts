import { test, expect } from '@playwright/test';

test('main matches', async ({ page }) => {
  await page.goto('http://127.0.0.1:8080/');
  await page.click('#excalibur-play');
  await page.waitForTimeout(500);
  await expect(page).toHaveScreenshot();
});