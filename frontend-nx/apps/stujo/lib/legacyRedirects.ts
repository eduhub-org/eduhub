/**
 * Lookups for the legacy StuJo → EduHub 301 redirects (see middleware.ts).
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
      { legacy: legacyStujoId }
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
 * into middleware.
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
      { alias: [`stujo:${legacySlug}`] }
    );
    return data.Organization[0]?.id ?? null;
  } catch {
    return null;
  }
}
