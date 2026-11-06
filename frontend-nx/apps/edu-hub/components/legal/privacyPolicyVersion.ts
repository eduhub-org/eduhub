/**
 * The version of the privacy policy, as the ISO date of its "Stand".
 *
 * Bump it together with the text in PrivacySections.tsx. For a material
 * change also set PRIVACY_NOTICE_VERSION and add its text to PRIVACY_NOTICES
 * below: every account created before that date then sees the one-time
 * "policy updated" notice (components/layout/PrivacyUpdateNotice.tsx).
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

/** A notice body as Markdown (paragraphs and `-` lists); the notice adds the title and the closing lines itself. */
export type PrivacyNotice = { version: string; de: string; en: string };

/**
 * The body of the EduHub "policy updated" notice for each notice version.
 * The text must keep apart what we actually do differently from what we only
 * describe more openly, so nobody reads newly documented practice as newly
 * introduced practice (docs/LEGAL_DOCUMENTS.md, "Wording the notice").
 * Newest first; never edit or drop an entry once its version is in production.
 * Kept in code rather than in the locale files so what users were told is
 * recoverable from git like the policy itself.
 */
export const PRIVACY_NOTICES: PrivacyNotice[] = [
  {
    version: '2026-11-05',
    de: [
      'Der Schutz deiner Daten und ein transparenter Umgang damit sind uns wichtig. Deshalb haben wir unsere Datenschutzerklärung überarbeitet:',
      '',
      '- Wir verzichten auf das Meta Pixel und messen die Nutzung unserer Plattform nur noch anonym und ohne Cookies.',
      '- Wir machen transparenter, welche Anmeldedienste und technischen Dienstleister wir für unsere Plattform nutzen, beispielsweise für E-Mails, Online-Sitzungen und den Kurs-Chat.',
      '- Wir erläutern genauer, wie wir mit Aufzeichnungen von Online-Sitzungen umgehen und welche Informationen wir im Rahmen unserer Förderprojekte an Fördermittelgeber weitergeben.',
      '',
      'Einige Änderungen betreffen das, was wir tatsächlich tun; andere beschreiben genauer, was wir schon bisher so gehandhabt haben.',
    ].join('\n'),
    en: [
      'Protecting your data and handling it transparently matter to us. That is why we have revised our privacy policy:',
      '',
      '- We have dropped the Meta Pixel and now measure the use of our platform only anonymously and without cookies.',
      '- We are more transparent about which sign-in services and technical service providers we use for our platform, for example for emails, online sessions and the course chat.',
      '- We explain in more detail how we handle recordings of online sessions and what information we pass on to funding organizations as part of our funded projects.',
      '',
      'Some of these changes are to what we actually do; others describe more precisely what we were already doing.',
    ].join('\n'),
  },
];

/** The notice text for a version, or null if none was recorded. */
export const getPrivacyNotice = (version: string): PrivacyNotice | null =>
  PRIVACY_NOTICES.find((notice) => notice.version === version) ?? null;

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
