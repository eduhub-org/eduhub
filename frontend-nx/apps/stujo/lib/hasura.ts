/**
 * Minimal server-side GraphQL fetcher for SSR/ISR pages.
 *
 * Public StuJo pages render anonymously (SEO), so no auth headers are
 * needed; Hasura's `anonymous` role permissions scope the data. Client-side
 * (employer dashboard) code uses the shared Apollo client from
 * `@eduhub/config/apollo` instead.
 */

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || '';

export async function fetchAnonymous<T = unknown>(
  query: string,
  variables?: Record<string, unknown>,
  // Optional deadline. Callers that must not hang on a stalled Hasura — the
  // redirect proxy above all, which holds a request open while it waits — pass
  // an AbortSignal.timeout() and treat the abort as "no answer".
  signal?: AbortSignal
): Promise<T> {
  return postGraphQL<T>(query, variables, {}, signal);
}

/**
 * Server-side read with the admin secret, for the few lookups the anonymous
 * role must not answer itself — e.g. *why* a job is no longer public. Only
 * ever call it with a hard-coded query and select just the fields the caller
 * needs: the result bypasses every permission. Resolves to null when the
 * secret is not configured, so callers degrade instead of failing.
 */
export async function fetchAdmin<T = unknown>(
  query: string,
  variables?: Record<string, unknown>,
  signal?: AbortSignal
): Promise<T | null> {
  const adminSecret = process.env.HASURA_ADMIN_SECRET;
  if (!adminSecret) return null;
  return postGraphQL<T>(query, variables, { 'x-hasura-admin-secret': adminSecret }, signal);
}

async function postGraphQL<T>(
  query: string,
  variables: Record<string, unknown> | undefined,
  headers: Record<string, string>,
  signal?: AbortSignal
): Promise<T> {
  if (!API_URL) {
    throw new Error('API_URL / NEXT_PUBLIC_API_URL is not configured');
  }
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify({ query, variables }),
    signal,
  });
  if (!res.ok) {
    throw new Error(`Hasura request failed: HTTP ${res.status}`);
  }
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) {
    throw new Error(`GraphQL error: ${json.errors[0].message}`);
  }
  if (!json.data) {
    throw new Error('GraphQL response contained no data');
  }
  return json.data;
}

/**
 * View counter, incremented on every job detail render like the Rails app
 * did on `show`. Anonymous users have no update permission, so this runs
 * server-side with the admin secret; failures must never break the page.
 */
export function incrementJobViews(id: number): void {
  const adminSecret = process.env.HASURA_ADMIN_SECRET;
  if (!API_URL || !adminSecret) return;
  void fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-hasura-admin-secret': adminSecret,
    },
    body: JSON.stringify({
      query:
        'mutation IncrementJobViews($id: Int!) { update_JobPosting_by_pk(pk_columns: {id: $id}, _inc: {views: 1}) { id } }',
      variables: { id },
    }),
  }).catch(() => undefined);
}
