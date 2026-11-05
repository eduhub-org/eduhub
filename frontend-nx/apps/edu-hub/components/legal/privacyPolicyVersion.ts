/**
 * The version of the privacy policy, as the ISO date of its "Stand".
 *
 * Bump it together with the text in PrivacySections.tsx. A bump also shows
 * every account created before this date the one-time "policy updated" notice
 * (components/layout/PrivacyUpdateNotice.tsx); write what changed into
 * `privacy_update.summary` in both locale files first. For changes that are
 * not material (wording, removed processing) leave the notice off by keeping
 * PRIVACY_NOTICE_VERSION at its old value. Process: docs/LEGAL_DOCUMENTS.md.
 */
export const PRIVACY_POLICY_VERSION = '2026-11-05';

/**
 * The policy version whose changes account holders are told about once. Equal
 * to PRIVACY_POLICY_VERSION when the latest change was material; otherwise
 * the last version that was.
 */
export const PRIVACY_NOTICE_VERSION = '2026-11-05';

/**
 * Whether a user still has to be told about the current notice version: their
 * account predates it and they have not dismissed it (or a later one).
 * Versions are ISO dates, so they compare as strings.
 */
export const isNoticeDue = (createdAt: string | null, seenVersion: string | null): boolean => {
  if (seenVersion && seenVersion >= PRIVACY_NOTICE_VERSION) return false;
  if (!createdAt) return false;
  return createdAt.slice(0, 10) < PRIVACY_NOTICE_VERSION;
};
