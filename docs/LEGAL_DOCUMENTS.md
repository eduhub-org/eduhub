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
sites do not process the same data. StuJo loads no Cookiebot, Plausible, Meta
Pixel or Formbricks and has no courses, guest registrations or newsletter;
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
2. **Update the version date.** For the privacy policy that is the
   `PrivacyAsOfDate` component in `PrivacySections.tsx`; the AGB pages carry
   their own stamp:
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

## How to Find Which Version a User Accepted

1. Query the user's `termsAcceptedAt` timestamp from their enrollment
2. Use git to find the document version at that time:
   ```bash
   # AGB (EduHub)
   git log --until="YYYY-MM-DD" -1 -- frontend-nx/apps/edu-hub/pages/terms/index.tsx
   git show <commit-hash>:frontend-nx/apps/edu-hub/pages/terms/index.tsx
   # AGB (StuJo job postings)
   git log --until="YYYY-MM-DD" -1 -- frontend-nx/apps/stujo/pages/agb.tsx
   # Privacy policy (both sites)
   git log --until="YYYY-MM-DD" -1 -- frontend-nx/apps/edu-hub/components/legal/PrivacySections.tsx
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
