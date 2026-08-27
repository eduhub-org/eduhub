# Legal Documents (Terms & Privacy Policy)

## Document Locations

- **Terms & Conditions (AGB):** `frontend-nx/apps/edu-hub/pages/terms/index.tsx`
- **Privacy Policy (Datenschutz):** `frontend-nx/apps/edu-hub/pages/privacy/index.tsx`
- **Imprint:** `frontend-nx/apps/edu-hub/pages/imprint/index.tsx`

## How Consent Tracking Works

When users accept terms during paid course registration:
1. The timestamp is stored in `CourseEnrollment.termsAcceptedAt`
2. Git history tracks which version of the document was active at that time

Guest registrations use the same column: `confirmGuestRegistration` sets
`termsAcceptedAt` when the double opt-in link is redeemed, so the timestamp
records the moment the registration became valid.

Newsletter consent is tracked separately in `OrganizationNewsletterSubscription`
(`status`, `source`, `updated_at`) rather than as a timestamp on the enrollment,
because it is per organization and can be withdrawn independently.

## How to Update Legal Documents

1. **Edit the document content** in the respective file
2. **Update the version date** at the bottom of the page:
   ```tsx
   <p className="text-sm text-gray-400">{isEnglish ? 'As of: [NEW DATE]' : 'Stand: [NEW DATE]'}</p>
   ```
3. **Commit with a clear message:**
   ```bash
   git commit -m "docs: Update Terms & Conditions"
   ```
4. **Deploy the changes**

## How to Find Which Version a User Accepted

1. Query the user's `termsAcceptedAt` timestamp from their enrollment
2. Use git to find the document version at that time:
   ```bash
   git log --until="YYYY-MM-DD" -1 -- frontend-nx/apps/edu-hub/pages/terms/index.tsx
   git show <commit-hash>:frontend-nx/apps/edu-hub/pages/terms/index.tsx
   ```

## Internationalization

All legal pages support both German and English translations. The language is automatically determined based on the user's locale setting (`/en/` prefix or browser language). The pages use Next.js router locale detection to conditionally render content.

## Version History

| Date       | Document        | Changes                                   |
| ---------- | --------------- | ----------------------------------------- |
| 2026-02-05 | Terms & Privacy | Initial versions with payment registration |
| 2026-08-27 | Privacy         | Added guest registration (Art. 6(1)(b), 12-month retention, self-service deletion) and the newsletter section (Art. 6(1)(a), Ghost as processor) |
