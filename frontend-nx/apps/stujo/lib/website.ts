/**
 * Website value handling shared by the dashboard identity row (which renders a
 * link) and OrganizationWebsiteField (which validates before saving).
 *
 * Organization.website is free text in the database, and rows imported from the
 * old Rails app can carry a scheme-less value such as "www.example.de". Such a
 * value used directly as an href resolves *relative to the current page*, so
 * every outbound link must be built through websiteHref().
 */

// A prefix check alone would accept "https://" (no host); parse it for real.
export const isAbsoluteHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname !== '';
  } catch {
    return false;
  }
};

/** An absolute http(s) URL safe to link to, or null when there is none. */
export const websiteHref = (value: string | null | undefined): string | null => {
  const trimmed = (value ?? '').trim();
  if (trimmed === '') return null;
  if (isAbsoluteHttpUrl(trimmed)) return trimmed;
  // Anything that already carries a scheme but did not validate above is
  // broken ("https://", "ftp://x"); prefixing it would only produce nonsense.
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) return null;
  // Scheme-less legacy value: assume https rather than dropping the link.
  const assumed = `https://${trimmed.replace(/^\/+/, '')}`;
  return isAbsoluteHttpUrl(assumed) ? assumed : null;
};

/** Host and path without scheme, "www." or a trailing slash: "example.de/jobs". */
export const websiteLabel = (value: string | null | undefined): string => {
  const href = websiteHref(value);
  if (!href) return '';
  try {
    const url = new URL(href);
    const path = url.pathname === '/' ? '' : url.pathname;
    return `${url.host.replace(/^www\./, '')}${path}${url.search}`.replace(/\/$/, '');
  } catch {
    return (value ?? '').trim();
  }
};
