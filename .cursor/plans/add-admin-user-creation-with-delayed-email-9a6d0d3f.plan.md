<!-- 9a6d0d3f-770b-40d7-9268-97eb4aba2238 4a0cc1a0-3936-45af-b38e-e049a3333273 -->
# Simplify User Creation: Immediate Email Option

The user wants to simplify the user creation flow by removing the delayed email functionality and replacing it with an optional "Send immediately" checkbox. This requires reverting the recent infrastructure changes for scheduled emails and updating the frontend/backend logic.

## 1. Database & Metadata Cleanup

- [ ] Create a new migration to drop `scheduledAt` column from `MailLog`.
- [ ] Remove `process_scheduled_user_emails` cron trigger from `backend/metadata/cron_triggers.yaml`.
- [ ] Update `backend/metadata/actions.graphql` to:
    - Add `sendEmail: Boolean!` to `createUser` arguments.
    - Remove `scheduledAt` from `CreateUserResult`.

## 2. Backend Code Updates

- [ ] **functions/callNodeFunction/createUser/index.js**:
    - Accept `sendEmail` parameter from input.
    - Remove date calculation logic for `scheduledAt`.
    - Wrap `queueEmail` call in `if (sendEmail) { ... }`.
    - Update return object.
- [ ] **functions/callNodeFunction/lib/queueEmail.js**:
    - Remove `scheduledAt` parameter and logic.
    - Ensure inserted `MailLog` status is `READY_TO_SEND` (default) so the existing `sendMail` trigger picks it up immediately.
- [ ] **functions/sendMail/index.js**:
    - Remove the check for `scheduledAt` (revert to original behavior of sending immediately).
- [ ] **functions/callNodeFunction/processScheduledEmails/**:
    - Delete this directory.
- [ ] **functions/callNodeFunction/index.js**:
    - Remove import/export of `processScheduledEmails`.

## 3. Frontend Updates

- [ ] **frontend-nx/apps/edu-hub/queries/user.ts**:
    - Update `CREATE_USER` mutation to pass `$sendEmail`.
- [ ] **frontend-nx/apps/edu-hub/components/pages/ManageUsersContent/CreateUserDialog.tsx**:
    - Add a Checkbox for "Send welcome email" (default: true).
    - Pass `sendEmail` state to the mutation variables.
- [ ] **frontend-nx/apps/edu-hub/locales/**:
    - Add translation key for the new checkbox label (e.g., `send_welcome_email`).

## 4. Verification

- [ ] Verify `createUser` sends email immediately when checkbox is checked.
- [ ] Verify no email is sent when checkbox is unchecked.
- [ ] Verify `MailLog` no longer expects `scheduledAt`.

### To-dos

- [ ] Create database migration to drop scheduledAt column from MailLog
- [ ] Update Hasura metadata (remove cron trigger, update action definition)
- [ ] Update sendMail function to remove scheduledAt logic
- [ ] Update queueEmail library to remove scheduledAt support
- [ ] Delete processScheduledEmails function and update index
- [ ] Update createUser backend function to handle immediate optional email
- [ ] Update frontend GraphQL mutation and Dialog component
- [ ] Verify cleanup and testing