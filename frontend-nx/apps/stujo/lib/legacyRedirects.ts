/**
 * Lookups for the legacy StuJo → EduHub 301 redirects (see proxy.ts).
 *
 * The migrated records keep their old Rails id/slug so inbound links and SEO
 * survive the cutover: JobPosting.legacyStujoId holds the old job id, and
 * Organization.aliases holds the old employer slug as `stujo:<id>-<slug>`
 * (see scripts/stujo_etl.py). The new public URLs use the fresh Postgres
 * primary keys, so an old id has to be *mapped*, not passed through.
 *
 * Any failure returns null so the caller falls through to normal 404 handling —
 * a redirect lookup must never take a page down.
 */
import { fetchAnonymous } from './hasura';

/**
 * Deadline for the lookups below. The proxy awaits them before it can answer,
 * so a Hasura that accepts a request but never completes it would hold the
 * visitor's request — and a Cloud Run concurrency slot — open until an
 * infrastructure timeout. Past this point a redirect is not worth waiting for:
 * the visitor gets the plain 404 instead.
 */
const LOOKUP_TIMEOUT_MS = 2000;

/** Old Rails job id → new JobPosting.id (or null if unknown). */
export async function lookupNewJobId(legacyStujoId: number): Promise<number | null> {
  try {
    const data = await fetchAnonymous<{ JobPosting: { id: number }[] }>(
      /* GraphQL */ `
        query LegacyJobId($legacy: Int!) {
          JobPosting(where: { legacyStujoId: { _eq: $legacy } }, limit: 1) {
            id
          }
        }
      `,
      { legacy: legacyStujoId },
      AbortSignal.timeout(LOOKUP_TIMEOUT_MS)
    );
    return data.JobPosting[0]?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Old employer slug (`<id>-<slug>` from /arbeitgeber/:id-:slug) → new
 * Organization.id. Matches the alias `stujo:<id>-<slug>` stored on the org.
 *
 * Reserved for when the /arbeitgeber route exists (plan §8.2); not yet wired
 * into the proxy, since a redirect to a route that does not exist is a worse
 * 404 than the one the visitor already gets.
 */
export async function lookupNewOrgIdByLegacySlug(legacySlug: string): Promise<number | null> {
  try {
    const data = await fetchAnonymous<{ Organization: { id: number }[] }>(
      /* GraphQL */ `
        query LegacyOrgId($alias: jsonb!) {
          Organization(where: { aliases: { _contains: $alias } }, limit: 1) {
            id
          }
        }
      `,
      { alias: [`stujo:${legacySlug}`] },
      AbortSignal.timeout(LOOKUP_TIMEOUT_MS)
    );
    return data.Organization[0]?.id ?? null;
  } catch {
    return null;
  }
}
