import { gql } from 'graphql-request';

/**
 * Shared pieces of the StuJo self-service organization claim, used by the
 * claimJobOrganization and requestJobOrganizationAccess actions.
 *
 * The claim is instant: the first person to select an organization that has no
 * job admin gets canManageJobs immediately, so they can post without waiting
 * for anyone. What makes that safe to operate is not a gate but a record — the
 * notification mail plus the verification state stored on the grant — so the
 * classification below is the load-bearing part of this file.
 */

/**
 * Free-mail providers, which never verify a claim: everybody can have an
 * address at one, so a match against an organization's own domain would mean
 * nothing. Kept deliberately short — the common German and international ones.
 * An address here does not block the claim, it only makes it UNVERIFIED.
 */
const FREE_MAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'gmx.de',
  'gmx.net',
  'gmx.at',
  'gmx.ch',
  'web.de',
  't-online.de',
  'freenet.de',
  'posteo.de',
  'mailbox.org',
  'outlook.com',
  'outlook.de',
  'hotmail.com',
  'hotmail.de',
  'live.com',
  'live.de',
  'yahoo.com',
  'yahoo.de',
  'icloud.com',
  'me.com',
  'proton.me',
  'protonmail.com',
  'aol.com',
  'zoho.com',
  'yandex.com',
]);

/** The domain part of an email address, lowercased. Null when there isn't one. */
export function emailDomain(email) {
  if (typeof email !== 'string') return null;
  const at = email.lastIndexOf('@');
  if (at < 1 || at === email.length - 1) return null;
  const domain = email.slice(at + 1).trim().toLowerCase();
  return domain === '' ? null : stripWww(domain);
}

/**
 * The registrable-looking host of a website value, lowercased and without a
 * leading `www.`. Accepts the bare hostnames people actually type into a
 * website field ("beispiel.de", "beispiel.de/karriere") as well as full URLs.
 */
export function websiteDomain(website) {
  if (typeof website !== 'string') return null;
  const trimmed = website.trim();
  if (trimmed === '') return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const host = new URL(withScheme).hostname.toLowerCase();
    return host === '' ? null : stripWww(host);
  } catch {
    return null;
  }
}

function stripWww(host) {
  return host.startsWith('www.') ? host.slice(4) : host;
}

export const CLAIM_DOMAIN_VERIFIED = 'SELF_SERVICE_DOMAIN_VERIFIED';
export const CLAIM_UNVERIFIED = 'SELF_SERVICE_UNVERIFIED';
export const CLAIM_NEW_ORGANIZATION = 'NEW_ORGANIZATION';

/**
 * How much confidence the claim deserves, from the only evidence available at
 * claim time: whether the claimer's email domain is the organization's own.
 *
 * @param {string} claimerEmail
 * @param {{website?: string|null, email?: string|null}} organization
 * @returns {'SELF_SERVICE_DOMAIN_VERIFIED'|'SELF_SERVICE_UNVERIFIED'}
 */
export function classifyClaim(claimerEmail, organization) {
  const claimerDomain = emailDomain(claimerEmail);
  if (!claimerDomain || FREE_MAIL_DOMAINS.has(claimerDomain)) {
    return CLAIM_UNVERIFIED;
  }
  const organizationDomains = [
    websiteDomain(organization?.website),
    emailDomain(organization?.email),
  ].filter(Boolean);

  return organizationDomains.includes(claimerDomain) ? CLAIM_DOMAIN_VERIFIED : CLAIM_UNVERIFIED;
}

/**
 * German one-liner for the notification mail. The reviewer reading it should not
 * have to know the enum, so this says what was checked, not what it is called.
 */
export function verificationLabel(verification) {
  switch (verification) {
    case CLAIM_DOMAIN_VERIFIED:
      return 'E-Mail-Domain stimmt mit der Organisation überein';
    case CLAIM_NEW_ORGANIZATION:
      return 'Organisation neu angelegt – es gab nichts zu prüfen';
    case CLAIM_UNVERIFIED:
    default:
      return 'Nicht geprüft – bitte kurz nachsehen';
  }
}

/**
 * Comparison key for organization names, so a claim for "Beispiel GmbH" finds
 * the existing "Beispiel  gmbh." instead of creating a second row. Only for
 * matching — never stored, and never used to rewrite what the user typed.
 *
 * Deliberately conservative: it folds case, punctuation and whitespace but
 * keeps legal forms, because "Beispiel GmbH" and "Beispiel AG" are different
 * companies. A key that normalizes to nothing (punctuation only) matches
 * nothing, mirroring the same guard in scripts/stujo_etl.py.
 */
export function organizationNameKey(name) {
  if (typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** LIKE metacharacters in a value that is going into an _ilike pattern. */
export function likeEscape(value) {
  return String(value).replace(/([\\%_])/g, '\\$1');
}

/**
 * Candidates for the dedupe check. Bounded by a pattern on the longest word of
 * the typed name rather than fetching every Organization — the StuJo import left
 * thousands of them. Alias matching then runs over these candidates, so an
 * organization whose *name* shares no word with what was typed and only matches
 * by alias is not found; that yields a duplicate row, which is the same outcome
 * the import already produces and is cleaned up the same way.
 */
export const FIND_ORGANIZATION_CANDIDATES = gql`
  query FindOrganizationCandidatesForClaim($pattern: String!) {
    Organization(where: { name: { _ilike: $pattern } }, limit: 200) {
      id
      name
      aliases
    }
  }
`;

/** The `$pattern` for FIND_ORGANIZATION_CANDIDATES, or null if nothing usable was typed. */
export function candidatePattern(typedName) {
  const words = organizationNameKey(typedName).split(' ').filter(Boolean);
  if (words.length === 0) return null;
  const longest = words.reduce((a, b) => (b.length > a.length ? b : a));
  return `%${likeEscape(longest)}%`;
}

/**
 * An existing organization whose name or alias means the same thing as what the
 * claimer typed, or null. Aliases carry the legacy StuJo slugs, so a company
 * that moved over under a slightly different name is still found.
 */
export function matchOrganizationByName(typedName, organizations) {
  const key = organizationNameKey(typedName);
  if (key === '') return null;

  return (
    organizations.find((organization) => organizationNameKey(organization.name) === key) ||
    organizations.find((organization) =>
      toAliasList(organization.aliases).some((alias) => organizationNameKey(alias) === key)
    ) ||
    null
  );
}

/** Organization.aliases is jsonb and has held both a bare array and {name} objects. */
function toAliasList(aliases) {
  if (!Array.isArray(aliases)) return [];
  return aliases
    .map((alias) => {
      if (typeof alias === 'string') return alias;
      if (alias && typeof alias === 'object' && typeof alias.name === 'string') return alias.name;
      return null;
    })
    .filter(Boolean);
}

const GET_PORTAL_CONTACT_EMAIL = gql`
  query GetJobPortalContactEmail($appName: String!) {
    JobPortal(where: { appName: { _eq: $appName } }, limit: 1) {
      contactEmail
    }
  }
`;

/**
 * The address responsible for StuJo enquiries: the portal's own contact address,
 * falling back to the platform-wide env var. Null when neither is configured —
 * callers must treat that as "skip the mail", never as a reason to fail.
 */
export async function resolveContactEmail(client, portalAppName, logger) {
  if (portalAppName) {
    try {
      const data = await client.request(GET_PORTAL_CONTACT_EMAIL, { appName: portalAppName });
      const contactEmail = data?.JobPortal?.[0]?.contactEmail;
      if (contactEmail) return contactEmail;
    } catch (error) {
      logger?.warn?.('Could not read JobPortal.contactEmail, falling back to STUJO_ADMIN_EMAIL', {
        error: error.message,
      });
    }
  }
  return process.env.STUJO_ADMIN_EMAIL || null;
}

/** Link the notification mails point at to review or revoke a grant. */
export function adminAccessUrl() {
  const base = process.env.FRONTEND_URL || 'https://edu.opencampus.sh';
  return `${base.replace(/\/+$/, '')}/manage/settings/access`;
}

/** Display name of a user, for a mail or a UI that must not leak their address. */
export function displayName(user) {
  return [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
}
