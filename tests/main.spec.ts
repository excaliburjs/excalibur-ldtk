import { test, expect } from '@playwright/test';

test('main matches', async ({ page }) => {
  await page.goto('http://localhost:8080/sample.html');
  await page.click('#excalibur-play', {timeout: 2 * 60_000});
  await expect(page).toHaveScreenshot();
});

test('autotile matches', async ({ page }) => {
  await page.goto('http://localhost:8080/autotile.html');
  await page.click('#excalibur-play', {timeout: 2 * 60_000});
  await expect(page).toHaveScreenshot();
});

test('pure autotile matches', async ({ page }) => {
  await page.goto('http://localhost:8080/pureautotile.html');
  await page.click('#excalibur-play', {timeout: 2 * 60_000});
  await expect(page).toHaveScreenshot();
});
