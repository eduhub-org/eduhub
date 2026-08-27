# Guest Registration (account-less event signup)

Lets someone register for an event with just a name and an email address, with
no Keycloak account. Off by default; an organizer enables it per event.

## What a guest is

A guest is an ordinary `User` row with `status = 'GUEST'` and no Keycloak
account. That is the whole trick: `CourseEnrollment.userId`, every `MailLog`
recipient and `OrganizationNewsletterSubscription.userId` all key off `User.id`,
so enrollment, the confirmation mail, session reminders, reschedule notices,
cancellations and newsletter opt-in work with **no guest-specific mail code**.

Two consequences worth knowing:

- `User.id` is no longer always a Keycloak user id. It is for every non-guest.
- A guest who later signs up properly gets a **second** `User` row. Merging is
  out of scope here and tracked as issue #1337.

## The flow

```
visitor fills the form on /course/<id>
        │
        ▼
registerGuestForCourse            creates a GUEST User + hashed token
        │                         mails a confirmation link
        │                         NO enrollment yet
        ▼
guest clicks the link  →  /guest/confirm?token=…
        │
        ▼
confirmGuestRegistration          inserts CourseEnrollment (REGISTERED)
        │                         → send_enrollment_status_email trigger
        │                         → REGISTRATION_CONFIRMED mail
        │                         records newsletter consent if ticked
        ▼
guest is registered; every mail carries a /guest/manage link
```

Nothing is registered before the link is used. An address someone else typed
never becomes a registration and never receives follow-up mail.

## Enabling it for an event

Manage course → Description tab → **Allow registration without an account**.

The toggle only appears, and the backend only accepts a guest registration,
when all of these hold:

| Condition | Why |
|---|---|
| `Course.guestRegistrationEnabled` | Explicit opt-in per event |
| `Course.published` and `Program.published` | Same visibility gate as the course page |
| `Program.type = 'EVENTS'` | Guest signup is for standalone events, not multi-session courses |
| `registrationType` is `DIRECT_CONFIRMATION` or `DIRECT_WITH_INPUT` | No approval workflows (need an admin decision the guest cannot see) and nothing involving payment (Stripe, invoices, statutory retention) |
| Not at `maxParticipants` | Same capacity rule as normal registration |

## Data protection

| Question | Answer |
|---|---|
| What is collected | First name, last name, email. Nothing else. |
| Legal basis | Art. 6(1)(b) — performance of a contract / pre-contractual measures. Note this differs from regular participant profile data, which the privacy policy bases on Art. 6(1)(f). |
| Retention | `AppSettings.guestDataRetentionMonths`, default **12**, counted from the end of the event. Enforced by the `anonymize_guest_data` cron. |
| Erasure on request | Self-service via the manage link in every mail. No login needed. |
| Marketing | Separate, unticked, never required. Recorded only after confirmation, then handed to Ghost for its own double opt-in. |

### Retention job

`functions/callPythonFunction/pythonFunctions/anonymize_guest_data.py`, daily at
04:00 UTC via the `anonymize_guest_data` cron trigger. Two sweeps:

1. **Past retention** — guests whose events *all* ended more than
   `guestDataRetentionMonths` ago are anonymized in place (`ANON_USER`,
   `anon_*@example.com`, `status = DELETED`), matching what `anonymizeUser`
   produces. `CourseEnrollment` rows stay, so participant counts and reporting
   keep working against a record that is no longer identifiable. A guest with
   any event still running, or with no end date, is left alone.
2. **Abandoned signups** — guests with no enrollment whose confirmation window
   closed are hard-deleted. Nothing references them.

Idempotent: an anonymized guest is `DELETED`, so it is not selected again.

> **Ordering matters.** Erasure unsubscribes from Ghost *before* overwriting the
> email, because `syncGhostNewsletterSubscription` re-reads `User.email` when it
> runs. Anonymizing first would push the placeholder address to Ghost and leave
> the real one on the list. Both the cron and the self-service path do this.

> **If events are reported for EFRE / DLC funding**, the grant's evidence
> retention period is typically longer than 12 months and the participant list
> would be gone before an audit. Raise `AppSettings.guestDataRetentionMonths`
> rather than patching the job.

### Answering an Art. 15 access request from a guest

Everything held about a guest is: the `User` row (name, email, status,
timestamps), their `CourseEnrollment` rows, any
`OrganizationNewsletterSubscription` rows, and `MailLog` entries addressed to
them. The `/guest/manage` page already shows the first two — pointing the person
at their own link is usually the fastest complete answer.

## Security notes

- **The only unauthenticated writes in EduHub.** They are Hasura Actions, not
  `anonymous` insert permissions: no table grants the `anonymous` role write
  access, and that invariant should hold. Check it with a Hasura console scan of
  insert/update/delete permissions if you touch this area.
- **No account enumeration.** `registerGuestForCourse` returns an identical
  payload whether the address was unknown, already had an account, already had a
  pending confirmation, or was already enrolled. Only the address owner learns
  the difference, by email. Keep it that way when editing.
- **Rate limiting** caps confirmation mails per address per hour, so the form
  cannot be used to bomb a third party's inbox.
- **Tokens.** The confirmation token is random, stored only as a SHA-256 hash,
  single use, 7 days. The manage token is a stateless HMAC over the user id
  signed with `GUEST_TOKEN_SECRET` — nothing is stored, so any mailer can
  regenerate the link, and the trade-off is that an individual link cannot be
  revoked. It stops working when the guest record is anonymized.
- **`GUEST_TOKEN_SECRET` is a signing key.** Anyone holding it can mint a manage
  link for any guest. The dev default in `docker-compose.yml` is fine locally and
  nowhere else.

## Files

| Layer | Path |
|---|---|
| Migrations | `backend/migrations/default/1788100000000_*` … `1788100000004_*` |
| Actions | `backend/metadata/actions.yaml`, `actions.graphql` |
| Token table | `backend/metadata/databases/default/tables/public_GuestRegistrationToken.yaml` |
| Shared helpers | `functions/callNodeFunction/guestRegistration.js` |
| Handlers | `functions/callNodeFunction/{registerGuestForCourse,confirmGuestRegistration,manageGuestRegistration}/` |
| Guest mail footer | `functions/callNodeFunction/sendEnrollmentEmail/index.js` |
| Retention cron | `functions/callPythonFunction/pythonFunctions/anonymize_guest_data.py` |
| Form | `frontend-nx/apps/edu-hub/components/pages/CourseContent/Registration/GuestRegistrationModal.tsx` |
| Public pages | `frontend-nx/apps/edu-hub/pages/guest/{confirm,manage}.tsx` |
| GraphQL documents | `frontend-nx/apps/edu-hub/queries/guestRegistration.ts` |
| Privacy text | `frontend-nx/apps/edu-hub/pages/privacy/index.tsx` (section 4) |

## Testing locally

`ENVIRONMENT=development` makes `sendMail` log the mail instead of sending it,
so the confirmation link comes out of the `node_functions` container log:

```bash
docker compose up -d
docker compose exec hasura hasura-cli migrate apply --database-name default
docker compose exec hasura hasura-cli metadata apply
docker compose logs -f node_functions   # the confirm link appears here
```

1. Create a published course in a published `EVENTS` program,
   `registrationType = DIRECT_CONFIRMATION`, guest registration enabled.
2. In a logged-out browser, submit the guest form on `/course/<id>`.
3. Expect: a `User` row with `status = 'GUEST'`, one `GuestRegistrationToken`,
   **no `CourseEnrollment`**, one `MailLog` row of type
   `GUEST_REGISTRATION_CONFIRM`.
4. Open the link from the log. Expect a `CourseEnrollment` with status
   `REGISTERED` and a non-null `termsAcceptedAt`, `usedAt` set on the token, and
   a `REGISTRATION_CONFIRMED` mail carrying the manage footer.
5. Shift the `Session.startDateTime` and expect a `SESSION_RESCHEDULED` mail to
   the guest — this is the proof that guests inherit the existing pipeline.
6. Open the manage link, delete everything, and confirm the `User` row is
   anonymized, the tokens are gone, and the link is inert on a second use.

To exercise retention, backdate the course's `endTime` beyond the period and
invoke the function directly; run it twice to confirm the second run is a no-op.
