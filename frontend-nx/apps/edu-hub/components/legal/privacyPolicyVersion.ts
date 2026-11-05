/**
 * The version of the privacy policy, as the ISO date of its "Stand".
 *
 * Bump it together with the text in PrivacySections.tsx and add an entry to
 * PRIVACY_POLICY_CHANGES below. For a material change also set
 * PRIVACY_NOTICE_VERSION: every account created before that date then sees
 * the one-time "policy updated" notice (components/layout/PrivacyUpdateNotice.tsx).
 * For changes that are not material (wording, removed processing) leave
 * PRIVACY_NOTICE_VERSION at its old value. Process: docs/LEGAL_DOCUMENTS.md.
 */
export const PRIVACY_POLICY_VERSION = '2026-11-05';

/**
 * The policy version whose changes account holders are told about once. Equal
 * to PRIVACY_POLICY_VERSION when the latest change was material; otherwise
 * the last version that was.
 */
export const PRIVACY_NOTICE_VERSION = '2026-11-05';

export type PrivacyPolicySite = 'eduhub' | 'stujo';

/** `sites`: whose policy the change is about - the two sites share most of the text but not all of it. */
export type PrivacyPolicyChange = { version: string; sites: PrivacyPolicySite[]; de: string; en: string };

/**
 * What changed in each version, in words for users: shown as the change
 * history at the end of each site's privacy policy (entries filtered by
 * `sites`), and the entry for PRIVACY_NOTICE_VERSION is the summary in the
 * EduHub "policy updated" notice. A version that changed nothing a site's
 * users would notice simply leaves that site out.
 * Newest first; never edit or drop an entry once its version is in production
 * (until then, extend it instead of adding a version). Kept in code rather than in
 * the locale files so the history is recoverable from git like the policy
 * itself, and because StuJo renders the policy sections with its own locales.
 * Tracked from 2026-11-05 on (StuJo from its first entry); older versions are
 * listed (for the team) in docs/LEGAL_DOCUMENTS.md.
 */
export const PRIVACY_POLICY_CHANGES: PrivacyPolicyChange[] = [
  {
    version: '2026-11-05',
    sites: ['eduhub'],
    de: 'Wir verzichten auf das Meta Pixel und auf das Cookie-Banner, messen Besuche nur noch anonym und ohne Cookies und nennen jetzt alle Dienste, über die du dich anmelden kannst.',
    en: 'We no longer use the Meta Pixel or a cookie banner, measure visits only anonymously and without cookies, and now name every service you can sign in with.',
  },
];

/** The changes one site's history lists, newest first. */
export const getPrivacyPolicyChanges = (site: PrivacyPolicySite): PrivacyPolicyChange[] =>
  PRIVACY_POLICY_CHANGES.filter((change) => change.sites.includes(site));

/** The change summary for a version, or null if none was recorded. */
export const getPrivacyPolicyChange = (version: string): PrivacyPolicyChange | null =>
  PRIVACY_POLICY_CHANGES.find((change) => change.version === version) ?? null;

/**
 * Whether a user still has to be told about the current notice version: their
 * account dates from the version day or earlier and they have not dismissed it
 * (or a later one). The version day itself counts, because accounts created
 * that day before the deploy registered under the old policy. Versions are ISO
 * dates, so they compare as strings.
 */
export const isNoticeDue = (createdAt: string | null, seenVersion: string | null): boolean => {
  if (seenVersion && seenVersion >= PRIVACY_NOTICE_VERSION) return false;
  if (!createdAt) return false;
  return createdAt.slice(0, 10) <= PRIVACY_NOTICE_VERSION;
};
