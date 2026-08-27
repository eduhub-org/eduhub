import { expect, test } from '@playwright/test';

import { loginAs, submitKeycloakCredentials, userMenuButton } from '../support/login';
import { users } from '../support/users';

test.describe('authentication', () => {
  test('signs in through Keycloak from the header login button', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Anmelden', exact: true }).click();

    await submitKeycloakCredentials(page, users.admin);

    await expect(userMenuButton(page)).toBeVisible();
    // Back on the app's own origin, not stranded on a Keycloak error page.
    await expect(page).toHaveURL(/localhost:5000/);
  });

  test('offers the management section to an admin', async ({ page }) => {
    await loginAs(page, users.admin);
    await userMenuButton(page).click();

    const menu = page.getByRole('menu');
    await expect(menu.getByText('Verwaltung', { exact: true })).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: 'Kurse', exact: true })).toBeVisible();
  });

  test('hides the management section from a plain learner', async ({ page }) => {
    await loginAs(page, users.user);
    await userMenuButton(page).click();

    const menu = page.getByRole('menu');
    // The personal section is the proof the menu really opened, so the absent
    // management entries below cannot be a false negative on an unopened menu.
    await expect(menu.getByText('Persönlich', { exact: true })).toBeVisible();
    await expect(menu.getByText('Verwaltung', { exact: true })).toBeHidden();
    await expect(menu.getByRole('menuitem', { name: 'Kurse', exact: true })).toBeHidden();
  });

  test('lets an admin open the course management dashboard', async ({ page }) => {
    await loginAs(page, users.admin, '/manage/courses');

    // Rendered by TableGrid inside ManageCoursesContent, which only mounts once
    // the `admin` Hasura role has loaded the program list — so this covers the
    // JWT role reaching Hasura, not just the page being routable.
    await expect(page.getByRole('button', { name: 'Kurs hinzufügen' })).toBeVisible();
  });

  test('keeps the course management dashboard away from anonymous visitors', async ({ page }) => {
    await page.goto('/manage/courses');

    // The page is routable but renders no dashboard without a session
    // (pages/manage/courses/index.tsx), so assert on both halves: no management
    // UI, and the header still offering a login.
    await expect(page.getByRole('button', { name: 'Anmelden', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Kurs hinzufügen' })).toBeHidden();
  });
});
