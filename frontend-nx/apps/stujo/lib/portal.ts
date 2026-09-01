import { fetchAnonymous } from './hasura';

/**
 * Portal (tenant) resolution for the StuJo app.
 *
 * Portals are a BRANDING dimension only — all portals share one job pool
 * (see docs/STUJO_INTEGRATION_PLAN.md §2.4). The request host is resolved
 * to a JobPortal row in this order:
 *   1. JobPortalDomain.hostname (primary source — many hostnames per portal)
 *   2. AppSettings.domain (legacy single-domain fallback)
 *   3. the APP_NAME env var
 *   4. the root `stujo` portal
 * so local dev and single-domain deployments work without special DNS.
 *
 * The JobPortalDomain lookup (step 1) is best-effort: if that table is not
 * yet available it is skipped and resolution continues from step 2, so a
 * frontend deployed ahead of its migration degrades gracefully.
 */

export type PortalBranding = {
  appName: string;
  slug: string;
  title: string;
  defaultRegion: string | null;
  contactEmail: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  imprintUrl: string | null;
  privacyUrl: string | null;
  termsUrl: string | null;
};

const PORTAL_QUERY = /* GraphQL */ `
  query PortalByHost {
    JobPortal {
      slug
      title
      appName
      contactEmail
      defaultRegion
    }
    AppSettings {
      appName
      domain
      logoUrl
      faviconUrl
      primaryColor
      secondaryColor
      imprintUrl
      privacyUrl
      termsUrl
    }
  }
`;

// Queried separately from PORTAL_QUERY (and best-effort — see
// fetchPortalDomains) so that a frontend deployed ahead of the
// JobPortalDomain migration/metadata degrades to legacy resolution instead
// of failing every SSR page.
const PORTAL_DOMAIN_QUERY = /* GraphQL */ `
  query PortalDomains {
    JobPortalDomain {
      appName
      hostname
    }
  }
`;

type PortalQueryResult = {
  JobPortal: {
    slug: string;
    title: string;
    appName: string;
    contactEmail: string | null;
    defaultRegion: string | null;
  }[];
  AppSettings: {
    appName: string;
    domain: string | null;
    logoUrl: string | null;
    faviconUrl: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    imprintUrl: string | null;
    privacyUrl: string | null;
    termsUrl: string | null;
  }[];
};

type PortalDomain = {
  appName: string;
  hostname: string;
};

type PortalDomainQueryResult = {
  JobPortalDomain: PortalDomain[];
};

/**
 * Best-effort hostname → portal mapping. Returns an empty list (rather than
 * throwing) when the JobPortalDomain table/metadata is not yet available —
 * e.g. this image deployed ahead of its Hasura migration — so portal
 * resolution falls back to AppSettings.domain / APP_NAME instead of 500ing
 * every SSR page during the deploy window.
 */
async function fetchPortalDomains(): Promise<PortalDomain[]> {
  try {
    const data = await fetchAnonymous<PortalDomainQueryResult>(PORTAL_DOMAIN_QUERY);
    return data.JobPortalDomain ?? [];
  } catch (error) {
    console.warn(
      'resolvePortal: JobPortalDomain lookup failed, falling back to legacy resolution',
      error
    );
    return [];
  }
}

const FALLBACK_APP_NAME = process.env.APP_NAME || 'stujo';

export async function resolvePortal(host: string | undefined): Promise<PortalBranding> {
  const [data, portalDomains] = await Promise.all([
    fetchAnonymous<PortalQueryResult>(PORTAL_QUERY),
    fetchPortalDomains(),
  ]);

  const hostname = (host || '').split(':')[0].toLowerCase();
  const domainMapping = portalDomains.find((d) => d.hostname === hostname);
  const settingsByDomain = data.AppSettings.find((s) => s.domain === hostname);
  const appName =
    domainMapping?.appName || settingsByDomain?.appName || FALLBACK_APP_NAME;

  const portal =
    data.JobPortal.find((p) => p.appName === appName) ||
    data.JobPortal.find((p) => p.slug === 'stujo');
  const settings = data.AppSettings.find((s) => s.appName === appName);

  if (!portal) {
    throw new Error('No JobPortal rows found — did the seed migrations run?');
  }

  return {
    appName,
    slug: portal.slug,
    title: portal.title,
    defaultRegion: portal.defaultRegion,
    contactEmail: portal.contactEmail,
    logoUrl: settings?.logoUrl ?? null,
    faviconUrl: settings?.faviconUrl ?? null,
    primaryColor: settings?.primaryColor ?? null,
    secondaryColor: settings?.secondaryColor ?? null,
    imprintUrl: settings?.imprintUrl ?? null,
    privacyUrl: settings?.privacyUrl ?? null,
    termsUrl: settings?.termsUrl ?? null,
  };
}
