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
  variables?: Record<string, unknown>
): Promise<T> {
  if (!API_URL) {
    throw new Error('API_URL / NEXT_PUBLIC_API_URL is not configured');
  }
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables }),
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
