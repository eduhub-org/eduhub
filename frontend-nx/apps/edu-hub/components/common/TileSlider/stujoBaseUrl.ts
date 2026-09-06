/**
 * Resolve the Stujo job board base URL for outbound tile links.
 *
 * Job tiles link out to the Stujo deployment (a separate app on its own
 * domain), so links must be absolute Stujo URLs rather than EduHub-relative
 * paths. Priority:
 *   1. `NEXT_PUBLIC_STUJO_URL` when set at **build time** (Next inlines
 *      NEXT_PUBLIC_* into the client bundle, so a Cloud Run runtime env alone
 *      would not reach the browser). Set per environment as a GitHub Actions
 *      variable: production `https://stujo.net`, staging
 *      `https://stujo-staging.opencampus.sh`.
 *   2. Fallback constant `https://stujo.net` — the canonical public StuJo
 *      domain, only used when the build var is missing.
 */
export const getStujoBaseUrl = (): string => {
  // Strip a trailing slash so stujoJobUrl never produces a double slash if the
  // env var is configured with one (e.g. "https://stujo.net/").
  return (process.env.NEXT_PUBLIC_STUJO_URL || 'https://stujo.net').replace(/\/$/, '');
};

/**
 * Absolute link to a Stujo job detail page. Appends `?utm_source=eduhub` so
 * Stujo analytics can distinguish EduHub-referred views from organic ones.
 */
export const stujoJobUrl = (id: number): string =>
  `${getStujoBaseUrl()}/stellenangebote/${id}?utm_source=eduhub`;
