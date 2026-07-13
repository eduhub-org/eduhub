/**
 * Resolve the Stujo job board base URL for outbound tile links.
 *
 * Job tiles link out to the Stujo deployment (a separate app on its own
 * domain), so links must be absolute Stujo URLs rather than EduHub-relative
 * paths. Priority:
 *   1. `NEXT_PUBLIC_STUJO_URL` when explicitly configured (dev/staging/prod).
 *   2. Production fallback constant (matches `local.stujo_domain` in
 *      infrastructure/application/00_variables.tf, which defaults to
 *      stujo.opencampus.sh).
 */
export const getStujoBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_STUJO_URL || 'https://stujo.opencampus.sh';
};

/**
 * Absolute link to a Stujo job detail page. Appends `?utm_source=eduhub` so
 * Stujo analytics can distinguish EduHub-referred views from organic ones.
 */
export const stujoJobUrl = (id: number): string =>
  `${getStujoBaseUrl()}/stellenangebote/${id}?utm_source=eduhub`;
