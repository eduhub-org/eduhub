# Privacy: Meta Pixel removal, cookie banner, policy and information chain

Working plan for removing the Meta Pixel and the Cookiebot banner, updating the
privacy policy, and fixing how users are informed about it. This is not legal
advice: have opencampus' data-protection contact review the policy text before
it goes live.

Branch: `claude/magical-allen-oy9lrv` (based on `develop` @ 60b24123).

## Status

| Step | State | Commits |
| --- | --- | --- |
| A: Remove Meta Pixel and Cookiebot, update policy (Plausible, cookies, SSO) | Done | 5b07252b, d12d9c6e |
| B: Self-host Plus Jakarta Sans (app and Keycloak), redirect `/help` to GitBook | Done | 14ed8e9a |
| C: Complete processors and recipients in the policy | Open, partly blocked on team input | |
| D: Information chain (notices, server-side acceptance, policy versioning) | Open | |

Lint, type-check, all Jest tests and `yarn build` pass for A and B. Nothing has
been checked in a browser yet.

### After A and B are merged and deployed

- [ ] Rebuild Keycloak so the self-hosted login fonts take effect:
      `docker compose build keycloak && docker compose up -d keycloak`, and the
      production image (AGENTS.md rule 9).
- [ ] Meta Events Manager: deactivate pixel `1775867059535400` and request
      deletion of its data.
- [ ] Cancel the Cookiebot subscription and remove its domain configuration.
- [ ] Browser check in a fresh profile on `/`, a course page, `/privacy`, a
      widget and the Keycloak login: no requests to `facebook.*`,
      `cookiebot.com` or `fonts.googleapis.com`/`fonts.gstatic.com`; Plausible
      loads when logged out but not for admins; the Application tab shows only
      session cookies and EduHub localStorage keys; text renders in Plus
      Jakarta Sans.
- [ ] Check the Formbricks registration iframe for cookies the Formbricks host
      sets. It is already in the policy as part of the requested service.

## Why the banner could go

Cookiebot only gated two scripts: the Meta Pixel (`marketing`) and Plausible
(`statistics`). Plausible sets no cookies and stores nothing on the device.
Everything else EduHub stores is strictly necessary under § 25(2) Nr. 2 TDDDG:

- NextAuth and Keycloak session cookies
- the admin impersonation cookies
- UI preferences in localStorage: the last opened tab, the dismissed info
  banner, the program scope, and StuJo's selected employer

With the pixel gone, nothing needs consent. Plausible now runs on Art. 6(1)(f)
with a right to object, and the policy says so. Cookiebot had
`data-blockingmode="auto"`, which silently blocked third-party resources. That is
why B moved the Google Fonts onto our own server and stopped embedding the
GitBook help page.

## C: Complete processors and recipients in the policy

Rule: an **external processor** gets its own section (provider, purpose, legal
basis, DPA, third-country transfer). A **self-hosted tool** on our own GCP
infrastructure is covered by `PrivacyHosting` and is only mentioned by
*purpose* in the section where the processing happens.

External, each needing its own section in `components/legal/PrivacySections.tsx`:

- **Mailgun** (Mailgun Technologies, Inc. / Sinch, USA). Sends all transactional
  mail (`functions/sendMail`) and syncs delivery status
  (`sync_mail_delivery_status.py`). The account is on the EU region
  (`api.eu.mailgun.net`). Data: email, name, mail content, delivery and open
  events. Legal basis Art. 6(1)(b)/(f). Possible US access under the DPF and
  SCCs.
- **Zoom** (Zoom Communications, Inc., USA). Runs online sessions. Attendance
  reports (name, email, join and leave times) are pulled through the Reports
  API (`zoom_client.py`) for attendance tracking and certificates. Legal basis
  Art. 6(1)(b). Transfer under the DPF and SCCs.
- **Matrix/Element**. The homeserver is run by a paid service provider on
  Hetzner servers. That provider is our processor, with Hetzner as its
  sub-processor. Used for course chat rooms and the Matrix handle
  (`createMatrixRoom`, Keycloak `matrix-handle-listener`). Legal basis
  Art. 6(1)(b). EU location.
- **Funder participant data API / MOOCHub**
  (`functions/apiProxy/participant_data_handler.py`, pseudonymised enrolment
  and certificate status). This is a *recipient* (Art. 13(1)(e)), so it needs a
  named recipient and legal basis.

Self-hosted, so only the purpose is mentioned:

- **LimeSurvey**: attendance and location surveys. One sentence in
  `PrivacyCourseParticipation`.
- **Keycloak**: account and login. One sentence in the profile/account part.

Also add:

- Public speaker and instructor names and profile pictures.
- StuJo Job-Letter (`JobAlertSubscription`), in the StuJo policy only.
- Self-service account deletion in the profile (`docs/ACCOUNT_DELETION.md`).
  Say what is kept: invoices and Stripe records for the statutory periods, and
  shared content. Data at Zoom, LimeSurvey, Formbricks and Mailgun is handled
  on request. Matrix accounts are deactivated.
- `PrivacyPayments`: SEPA direct debit, and that Stripe creates and hosts the
  invoices.
- Bump `PrivacyAsOfDate`, add a row to the version history in
  `docs/LEGAL_DOCUMENTS.md`, and fix the stale docs
  (`frontend-nx/apps/edu-hub/pages/legal/README.md`,
  `docs/GUEST_REGISTRATION.md:230`).

Not mentioned: **Mattermost**, which is no longer used. Removing its leftover
code is a separate cleanup task.

### Open questions for the team (block C)

- [ ] Are the Mailgun and Zoom DPAs accepted for opencampus' accounts? Both are
      standard or click-through, so check the account settings or contracts.
- [ ] Zoom: which account type, and is the data region set to the EU?
- [ ] Matrix: the service provider's legal name and address, whether a DPA with
      them exists, and the Hetzner location (DE or FI).
- [ ] MOOCHub: which funder or recipient receives the data, and on what legal
      basis (funding agreement means Art. 6(1)(c)/(e), otherwise (f)).

## D: Information chain

### Do users have to accept a policy change?

No. A privacy policy is *information* under Art. 13/14 GDPR, not a contract.
Users must be able to find it when their data is collected, but nobody has to
click "accept". A combined "I accept the privacy policy" checkbox is discouraged
because it mixes information with consent. Users must be **actively notified**
of material changes: new purposes, new recipients, or a new legal basis
(Art. 13(3)). Real **consent** is only needed for processing that is based on
consent: the newsletter, project publication, and formerly the pixel.

A and B only remove processing and document what already existed. That needs
no notification, but a one-time "policy updated" notice is good transparency
once C adds the previously undisclosed processors.

### Current state

| Group | Informed when data is collected? | Record |
| --- | --- | --- |
| Everyone registering via Keycloak, including SSO (participants, instructors, StuJo) | **No.** `register.ftl` shows no AGB or privacy link. The T&C required action is disabled, and `termsText` is still a placeholder. | None |
| Free course enrolment and applications | **No** notice | None |
| Paid course enrolment, including waitlist invitations | Checkbox "AGB + Datenschutz akzeptieren" | `CourseEnrollment.termsAcceptedAt`, **set by the client and writable by user, instructor and org admin** |
| Guest registration | Checkbox, checked on the server | `termsAcceptedAt`, set by the server |
| Admin-created users and speakers | Email with policy link | Mail log |
| Instructors (confidentiality) | Versioned gate `InstructorConfidentialityGate` | `InstructorConfidentialityAcceptance(version)` |
| StuJo paid postings | AGB checkbox only, no privacy link | `JobPosting.termsAcceptedAt` (server) |
| StuJo Job-Letter | No notice | None |
| Policy changes | No notification mechanism | Only the hard-coded "Stand" date |

### Fixes, by priority

1. **Notice at registration.** In
   `keycloak/themes/edu-hub/login/register.ftl`, add a line below the submit
   button that also covers the SSO buttons: "Mit der Registrierung gelten unsere
   AGB. Informationen zur Verarbeitung deiner Daten findest du in der
   Datenschutzerklärung." Link both, add DE/EN keys in `messages_*.properties`,
   and replace the placeholder `termsText`. Rebuild Keycloak.
2. **Notices on free enrolment and applications** (`RegistrationModal.tsx`),
   **StuJo publishing** (`mein-stujo/neu.tsx`) and the **Job-Letter**
   (`job-letter.tsx`). Use new `next-intl` keys in both locales, with "Du" in
   German.
3. **Paid registration:** reword `accept_terms` to "Ich akzeptiere die AGB. Die
   Datenschutzerklärung habe ich zur Kenntnis genommen." Make
   `termsAcceptedAt` server-controlled: remove it from the insert and update
   permissions in `public_CourseEnrollment.yaml` and set it on the server,
   following the `JobPosting.termsAcceptedAt` pattern. This also covers the
   waitlist-invitation checkout (`retryEnrollmentId`); add a test for it.
4. **Policy versioning and notification.** Reuse the instructor-gate pattern,
   but don't block the page:
   - Add a `PRIVACY_POLICY_VERSION` constant next to `PrivacyAsOfDate`.
   - Add `User.privacyNoticeSeenVersion` (migration, Hasura permission limited
     to the user's own row; follow the five-layer rule in `/create-migration`).
   - Show a dismissible in-app notice while the stored version is older than
     the current one.
   - For material changes, send a one-off email using a new
     `PRIVACY_POLICY_UPDATED` template with `[System:PrivacyPolicyLink]`.
   - Document the process in `docs/LEGAL_DOCUMENTS.md`: what counts as
     material, who decides, and the steps.

### Verification for D

- Register a new Keycloak user and see the notice.
- As a user, a GraphQL mutation on `termsAcceptedAt` is rejected.
- Bump the policy version: the in-app notice appears once and stays dismissed.
