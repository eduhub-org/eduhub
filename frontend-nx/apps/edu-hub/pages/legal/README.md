# Legal Documents (Terms & Privacy Policy)

## Document Locations

- **Terms & Conditions (AGB):** `pages/terms/index.tsx`
- **Privacy Policy (Datenschutz):** `pages/privacy/index.tsx`

## How Consent Tracking Works

When users accept terms during paid course registration:
1. The timestamp is stored in `CourseEnrollment.termsAcceptedAt`
2. Git history tracks which version of the document was active at that time

## How to Update Legal Documents

1. **Edit the document content** in the respective file
2. **Update the version date** at the bottom of the page:
   ```tsx
   <p className="text-sm text-gray-400">Stand: [NEW DATE]</p>
   ```
3. **Commit with a clear message:**
   ```bash
   git commit -m "docs: Update Terms & Conditions effective YYYY-MM-DD"
   ```
4. **Deploy the changes**

## How to Find Which Version a User Accepted

1. Query the user's `termsAcceptedAt` timestamp from their enrollment
2. Use git to find the document version at that time:
   ```bash
   git log --until="YYYY-MM-DD" -1 -- frontend-nx/apps/edu-hub/pages/terms/index.tsx
   git show <commit-hash>:frontend-nx/apps/edu-hub/pages/terms/index.tsx
   ```

## Version History

| Date       | Document        | Changes                                   |
| ---------- | --------------- | ----------------------------------------- |
| 2026-01-30 | Terms & Privacy | Initial version with payment registration |
