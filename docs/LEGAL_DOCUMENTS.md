# Legal Documents (Terms & Privacy Policy)

## Document Locations

The privacy policy and the imprint TEXT lives in shared components, not in the
pages. Both the EduHub and the StuJo app render them, so there is one source of
truth for wording that applies to both sites:

- **Privacy Policy (Datenschutz) text:** `frontend-nx/apps/edu-hub/components/legal/PrivacySections.tsx`
- **Imprint text:** `frontend-nx/apps/edu-hub/components/legal/ImprintContent.tsx`
- **Terms & Conditions (AGB), EduHub:** `frontend-nx/apps/edu-hub/pages/terms/index.tsx`
- **Terms & Conditions (AGB), StuJo:** `frontend-nx/apps/stujo/pages/agb.tsx`

The pages that render them are thin frames (title, page chrome, section order):

| Route | File |
| --- | --- |
| EduHub `/privacy` (`/datenschutz` redirects here) | `frontend-nx/apps/edu-hub/pages/privacy/index.tsx` |
| EduHub `/imprint` (`/impressum` redirects here) | `frontend-nx/apps/edu-hub/pages/imprint/index.tsx` |
| StuJo `/datenschutz` | `frontend-nx/apps/stujo/pages/datenschutz.tsx` |
| StuJo `/impressum` | `frontend-nx/apps/stujo/pages/impressum.tsx` |

### Why StuJo renders fewer privacy sections

Campus Business Box e.V. runs both sites and is the controller on both, but the
sites do not process the same data. StuJo loads no Plausible or Formbricks
and has no courses, guest registrations or newsletter;
only StuJo publishes job postings. Each page therefore composes the sections
that apply to it, so neither site claims processing that does not happen there.
The organization-accounts section IS shared: a StuJo "employer account" is an
EduHub organization account (the same `OrganizationAdmin` grant, with
`canManageJobs` instead of `canManageDegrees`).

Because the two pages number their sections differently, **never
cross-reference a privacy section by number** -- name it instead. Section
numbers are passed in as a prop for exactly this reason.

## How Consent Tracking Works

When users accept terms during paid course registration:
1. The timestamp is stored in `CourseEnrollment.termsAcceptedAt`
2. Git history tracks which version of the document was active at that time

The timestamp is the server's, not the browser's: the
`course_enrollment_stamp_terms_acceptance` trigger replaces whatever a signed-in
caller sends with `now()`, and rejects an acceptance written on somebody else's
enrollment (an instructor or org admin cannot accept on a participant's behalf).
Only calls with the admin secret, such as `confirmGuestRegistration`, keep the
value they send. Changing or clearing an existing acceptance is blocked by
`course_enrollment_guard_participant_changes`.

The checkbox asks to **accept the AGB** and to **take note of** the privacy
policy. The privacy policy is information (Art. 13 GDPR), not something to
consent to, so it is never phrased as "I accept the privacy policy".

## Where people are told about the privacy policy

| Where | How |
| ----- | --- |
| Keycloak registration and login (including the SSO buttons) | Notice under the form linking `/agb` and `/datenschutz` of the portal the person came from (`template.ftl`, `legalNotice*` messages, `js/home-link.js`) |
| Course page, every non-external registration type | Notice under the registration button (`RegistrationPrivacyNotice`) |
| Paid course registration | AGB checkbox plus privacy note, recorded in `termsAcceptedAt` |
| Guest registration | Same checkbox, required by the server |
| StuJo: publishing a posting, Job-Letter | Notice linking `/datenschutz` |
| Admin-created accounts and speakers | `USER_CREATED` / `SESSION_SPEAKER_ADDED` mails link the policy |
| Policy changes | In-app notice and, for material changes, a one-off mail (below) |

Guest registrations use the same column: `confirmGuestRegistration` sets
`termsAcceptedAt` when the double opt-in link is redeemed, so the timestamp
records the moment the registration became valid.

Job postings use their own column: `JobPosting.termsAcceptedAt` records when
the poster accepted the AGB while publishing a paid posting. The privacy policy
describes this in its job-postings section.

Newsletter consent is tracked separately in `OrganizationNewsletterSubscription`
(`status`, `source`, `updated_at`) rather than as a timestamp on the enrollment,
because it is per organization and can be withdrawn independently.

## How to Update Legal Documents

1. **Edit the document content** in the respective file
2. **Update the version date.** For the privacy policy that is
   `PRIVACY_POLICY_VERSION` in `components/legal/privacyPolicyVersion.ts`,
   which `PrivacyAsOfDate` displays; the AGB pages carry their own stamp:
   ```tsx
   {isEnglish ? 'As of: [NEW DATE]' : 'Stand: [NEW DATE]'}
   ```
   Colours must come from the `--eduhub-*` token classes
   (`text-label-primary`, `text-label-secondary`). StuJo redefines those tokens
   to dark-on-light, so a literal `text-white` would be invisible there.
3. **Commit with a clear message:**
   ```bash
   git commit -m "docs: Update Terms & Conditions"
   ```
4. **Deploy the changes**

### Changing the privacy policy: who has to be told

Nobody has to accept a new version. Account holders must be **told** when a
change is material for them: new purposes, new recipients or processors, or a
new legal basis. Rewording, corrections and removing processing are not
material.

For a material change:

1. Add an entry for the new version at the top of `PRIVACY_POLICY_CHANGES`
   (same file as the policy version): one or two sentences per language,
   written for users, and `sites` - EduHub, StuJo or both, depending on whose
   users the change concerns. It appears in the change history at the end of
   that site's policy (`#aenderungen`) and is the summary in the EduHub notice.
   Add one for every version, material or not; never edit an old entry.
   StuJo's history starts with its first entry (none yet; the 2026-11-05
   changes only documented existing processing there).
2. Set `PRIVACY_NOTICE_VERSION` (same file) to the new
   `PRIVACY_POLICY_VERSION`. Every account created before that date then sees a
   dismissible notice on its next visit; the dismissal is stored in
   `User.privacyNoticeSeenVersion`. Accounts created later saw the new policy
   when they registered and are not shown it.
3. Optionally, after the deploy, send the `PRIVACY_POLICY_UPDATED` mail once.
   It links to the change history, so the template needs no editing:
   ```bash
   cd functions/callNodeFunction
   HASURA_ENDPOINT=https://hasura.opencampus.sh/v1/graphql \
   HASURA_ADMIN_SECRET=<hasura-admin-secret> \
   FRONTEND_URL=https://edu.opencampus.sh \
   node scripts/send-privacy-policy-update.js --version <PRIVACY_NOTICE_VERSION>         # dry run
   node scripts/send-privacy-policy-update.js --version <PRIVACY_NOTICE_VERSION> --send  # queue the mails
   ```
   The version is stored in `MailLog.metadata`, so the script never mails
   anyone twice for the same version and can be re-run after an interruption.

For a change that is not material, add the `PRIVACY_POLICY_CHANGES` entry but
leave `PRIVACY_NOTICE_VERSION` alone.

## How to Find Which Version a User Accepted

1. Query the user's `termsAcceptedAt` timestamp from their enrollment (or
   `JobPosting.termsAcceptedAt` for a job posting). Both are `timestamptz`:
   pass the **complete** timestamp including its time zone to `--until`, not
   just the date. A date-only bound can select a version published later that
   same day, which the user never accepted.
2. Use git to find the document version at that time:
   ```bash
   # AGB (EduHub)
   git log --until="YYYY-MM-DDTHH:MM:SSZ" -1 -- frontend-nx/apps/edu-hub/pages/terms/index.tsx
   git show <commit-hash>:frontend-nx/apps/edu-hub/pages/terms/index.tsx
   # AGB (StuJo job postings)
   git log --until="YYYY-MM-DDTHH:MM:SSZ" -1 -- frontend-nx/apps/stujo/pages/agb.tsx
   # Privacy policy (both sites; the version file carries the "Stand" date)
   git log --until="YYYY-MM-DDTHH:MM:SSZ" -1 -- frontend-nx/apps/edu-hub/components/legal/PrivacySections.tsx frontend-nx/apps/edu-hub/components/legal/privacyPolicyVersion.ts
   ```

   The whole privacy policy deliberately lives in that one file so this
   recovery stays a single `git log`. Do not split it across files. Before
   2026-09-09 the text lived in `frontend-nx/apps/edu-hub/pages/privacy/index.tsx`
   -- use `git log --follow` or query that path for older timestamps.

## Internationalization

All legal pages support both German and English translations. The language is automatically determined based on the user's locale setting (`/en/` prefix or browser language). The pages use Next.js router locale detection to conditionally render content.

## Version History

| Date       | Document        | Changes                                   |
| ---------- | --------------- | ----------------------------------------- |
| 2026-02-05 | Terms & Privacy | Initial versions with payment registration |
| 2026-08-27 | Privacy         | Added guest registration (Art. 6(1)(b), 12-month retention, self-service deletion) and the newsletter section (Art. 6(1)(a), Ghost as processor) |
| 2026-09-09 | Privacy         | Text moved into shared components so the StuJo app renders the same wording. Added company/organization accounts (Art. 6(1)(b) for the account and admin grant, Art. 6(1)(f) for the authorization check and admin notification) and, for StuJo only, job postings (Art. 6(1)(b) for publication, Art. 6(1)(f) for the aggregate view counter). Generalized "Profilinformationen" from course participants to the user account, since the section is now shared with a site that has no courses. Replaced the numeric "sections 7 and 8" cross-reference with the section names |
| 2026-11-05 | Privacy         | Removed the Meta Pixel and the Cookiebot consent banner and their sections. Plausible now runs without consent on Art. 6(1)(f) (no cookies, nothing stored on the device; right to object under Art. 21). Rewrote the tracking overview. Added "Cookies und lokale Speicherung" (strictly necessary storage only, § 25(2) Nr. 2 TDDDG) and single sign-on via Digital Learning Campus, Google, LinkedIn and GitHub (name and email only, Art. 6(1)(b), providers as independent controllers) to the shared data-collection section, so StuJo shows both too. The Art. 21 objection notice is now set in normal case inside a framed box instead of capitals (Art. 21(4) asks for a separate, explicit notice, not capitals) |
| 2026-11-05 | Privacy & AGB   | Information chain: notice with AGB and privacy links on the Keycloak registration and login pages (also covering SSO), on course registration, StuJo publishing and the Job-Letter. Paid and guest checkbox now reads "accept the AGB, take note of the privacy policy". `termsAcceptedAt` is stamped by the server and only by the participant. Policy versioning with a one-time in-app notice (`User.privacyNoticeSeenVersion`) and the `PRIVACY_POLICY_UPDATED` mail |
