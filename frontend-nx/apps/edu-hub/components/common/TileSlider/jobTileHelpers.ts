export { stujoJobUrl } from './stujoBaseUrl';

/**
 * Resolve a Stujo employer logo to an <img> URL. Mirrors stujo's
 * `resolveStorageUrl` (apps/stujo/lib/storage.ts): the saveFile cloud function
 * stores absolute URLs in production but bucket-relative paths in the dev
 * emulator. Deliberately NOT `getPublicImageUrl` — stujo uploads have no
 * resized `-{size}.webp` variants and don't follow the `/public/` path
 * convention that helper expects.
 */
export const resolveStujoLogoUrl = (pathOrUrl: string | null | undefined): string | null => {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const bucketUrl = (process.env.NEXT_PUBLIC_STORAGE_BUCKET_URL || '').replace(/\/$/, '');
  if (!bucketUrl) return pathOrUrl;
  return `${bucketUrl}/${pathOrUrl.replace(/^\//, '')}`;
};

/**
 * Formats a job posting's published timestamp as an exact calendar date,
 * e.g. "08.07.2026" (de) / "07/08/2026" (en). The timezone is pinned to
 * Europe/Berlin so the server (UTC) and client render the same day for
 * timestamps near midnight UTC (avoids a React hydration mismatch). Returns
 * null when there is no valid date.
 */
export const formatPublishedDate = (publishedAt: string | null | undefined, locale: string): string | null => {
  if (!publishedAt) return null;
  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Europe/Berlin',
  });
};
