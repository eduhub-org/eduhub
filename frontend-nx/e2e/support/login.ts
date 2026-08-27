import { expect, type Locator, type Page } from '@playwright/test';

import type { E2EUser } from './users';

/**
 * Browser-facing Keycloak origin. Must match `NEXT_PUBLIC_AUTH_URL`, which the
 * app bakes into the NextAuth Keycloak provider's `issuer` at build time — a
 * mismatch (`localhost` here vs `127.0.0.1` there) makes the redirect leave the
 * expected origin and the token exchange fail. Default mirrors
 * `apps/edu-hub/.env.development`.
 */
const keycloakURL = process.env.E2E_KEYCLOAK_URL ?? 'http://127.0.0.1:28080';

/**
 * The header's account button, present only once a session exists
 * (`components/layout/Header.tsx`). Anchored on the ARIA attributes rather than
 * the avatar image, because the avatar falls back to initials when the user has
 * no picture.
 */
export const userMenuButton = (page: Page): Locator => page.locator('header button[aria-haspopup="menu"]');

/**
 * Signs `user` in through the real Keycloak login form and resolves once the app
 * has a session.
 *
 * Enters the flow through `/auth/signin`, which calls `signIn('keycloak')` for
 * us, instead of clicking the header's Login button — that keeps the helper
 * independent of the button's translated label. The header button is exercised
 * on its own in `tests/authentication.spec.ts`.
 */
export async function loginAs(page: Page, user: E2EUser, callbackPath = '/'): Promise<void> {
  await page.goto(`/auth/signin?provider=keycloak&callbackUrl=${encodeURIComponent(callbackPath)}`);

  await submitKeycloakCredentials(page, user);

  // NextAuth lands on `callbackPath`; the account button proves the session
  // survived the callback rather than silently erroring back to anonymous.
  await expect(userMenuButton(page)).toBeVisible();
}

/** Fills and submits the Keycloak login form, waiting for it to appear first. */
export async function submitKeycloakCredentials(page: Page, user: E2EUser): Promise<void> {
  await page.waitForURL(`${keycloakURL}/realms/edu-hub/**`);

  // Ids come from the repo's own login theme, keycloak/themes/edu-hub/login/login.ftl.
  await page.locator('#username').fill(user.email);
  await page.locator('#password').fill(user.password);
  await page.locator('#kc-login').click();
}
