import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * Visual regression for the course tile "extended application period" pill.
 * Requires NEXT_PUBLIC_ENABLE_TILE_BANNER_PREVIEW=true (set in playwright.config webServer).
 *
 * Run from frontend-nx: `yarn test:e2e`
 * Screenshots are written to e2e-output/ (gitignored).
 */

const outputDir = path.join(__dirname, 'e2e-output');

test.describe('Extended application banner on course tile', () => {
  test('German locale shows German label only', async ({ page }) => {
    await page.goto('/de/dev/tile-banner-preview');
    await expect(page.getByTestId('tile-banner-preview-root')).toBeVisible();
    const banner = page.getByRole('status', { name: 'Verlängerte Bewerbungsfrist' });
    await expect(banner).toBeVisible();
    await expect(banner).toHaveAttribute('lang', 'de');
    await expect(banner).toContainText('Verlängerte Bewerbungsfrist');
    await expect(banner).not.toContainText('Extended application period');
    await page.screenshot({
      path: path.join(outputDir, 'tile-banner-de.png'),
      fullPage: true,
    });
  });

  test('English locale shows English label only', async ({ page }) => {
    await page.goto('/en/dev/tile-banner-preview');
    await expect(page.getByTestId('tile-banner-preview-root')).toBeVisible();
    const banner = page.getByRole('status', { name: 'Extended application period' });
    await expect(banner).toBeVisible();
    await expect(banner).toHaveAttribute('lang', 'en');
    await expect(banner).toContainText('Extended application period');
    await expect(banner).not.toContainText('Verlängerte');
    await page.screenshot({
      path: path.join(outputDir, 'tile-banner-en.png'),
      fullPage: true,
    });
  });
});
