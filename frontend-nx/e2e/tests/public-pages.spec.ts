import { expect, test } from '@playwright/test';

import { seededPublishedCourse } from '../support/seed';

test.describe('public pages', () => {
  test('serves the German start page with a login entry point', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/EduHub/);
    // German is the default locale, so it is served unprefixed at `/`.
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
    await expect(page.getByRole('button', { name: 'Anmelden', exact: true })).toBeVisible();
  });

  test('serves the English start page under the /en prefix', async ({ page }) => {
    await page.goto('/en');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('button', { name: 'Login', exact: true })).toBeVisible();
  });

  test('renders the imprint in both locales and keeps the /impressum redirect', async ({ page }) => {
    await page.goto('/imprint');
    await expect(page.getByRole('heading', { name: 'Impressum', level: 1 })).toBeVisible();

    await page.goto('/en/imprint');
    await expect(page.getByRole('heading', { name: 'Imprint', level: 1 })).toBeVisible();

    // Permanent redirect configured in apps/edu-hub/next.config.js.
    await page.goto('/impressum');
    await expect(page).toHaveURL(/\/imprint$/);
  });

  test('loads seeded course data for anonymous visitors', async ({ page }) => {
    await page.goto(`/course/${seededPublishedCourse.id}`);

    // Reaching the title means the whole read path worked end to end: Next.js
    // served the route, Apollo sent `CourseAnonymous` with the `anonymous`
    // Hasura role, and the row cleared that role's `published: true` filter.
    // `.first()` because the title also appears in the page's own hero heading.
    await expect(page.getByText(seededPublishedCourse.title).first()).toBeVisible();
  });
});
