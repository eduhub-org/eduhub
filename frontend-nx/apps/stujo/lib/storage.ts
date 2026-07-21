/**
 * Storage URL resolution. The saveFile cloud function returns absolute
 * URLs in production (public GCS objects) but bucket-relative paths in
 * the dev emulator — prefix those with the bucket base URL.
 */
const BUCKET_URL = (
  process.env.NEXT_PUBLIC_STORAGE_BUCKET_URL ||
  process.env.STORAGE_BUCKET_URL ||
  ''
).replace(/\/$/, '');

export function resolveStorageUrl(pathOrUrl: string | null | undefined): string | null {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  if (!BUCKET_URL) return pathOrUrl;
  return `${BUCKET_URL}/${pathOrUrl.replace(/^\//, '')}`;
}
