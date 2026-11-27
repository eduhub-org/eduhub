# Assistant widget (#2194)

The chat button and panel shown on every edu-hub page (mounted in
`components/layout/Page.tsx`). It is shared code: StuJo can mount
`AssistantWidget` through `@eduhub/components/assistant/AssistantWidget` and
restyle it with the `--eduhub-*` tokens (AGENTS.md rule 10). It is only
enabled in edu-hub for now.

- Logged out: the panel asks the visitor to log in.
- While an admin views the app as someone else: not available (the backend
  would act with the admin's token, not the viewed person's).
- The conversation lives in memory plus `sessionStorage` (keyed by user) and
  ends when the tab closes.
- A Proposed Change is applied or discarded only by the Organizer's click,
  which calls `/api/assistant/proposals` directly; the model never applies.
- The role sent as `x-hasura-role` is the normal role, except `org_admin` for
  org admins on `/manage` pages.

## Backend contract (#2193)

The backend's `lib/assistant/README.md` (PR #2200) is the spec. In short:

- `POST /api/assistant/chat` with `{ locale, messages: [{ role, content, proposals? }], pageContext }`
  and `x-hasura-role`. Failures before the stream answer JSON `{ error: { code, message } }`;
  otherwise SSE events `delta {text}`, `tool {name, status}`, `proposal` (the MCP
  `ProposedChangeResult` as-is), `report` (a drafted Report, vote or withdrawal, #2234),
  `error {code, message}`, and `done` always last.
- `POST /api/assistant/proposals` with `{ proposedChangeId, action: "apply" | "discard" }`. Only
  the widget's buttons call it; the model never gets apply or discard. Both buttons are disabled
  while a request is in flight and nothing retries (a duplicate apply of a stateless
  `create_course` proposal could create two courses). After discard the widget forgets the id
  (discard doesn't revoke it server-side), so later `proposals` entries omit it.
- `POST /api/assistant/reports` with `{ action: "create" | "vote" | "withdraw", … }`, only from a
  `ReportCard`'s button (#2234). A click while sending is dropped. A `create` sends the route of
  the page the question was asked on. The card's state travels back to the model in the
  `proposals` entries as kind `report_create`, `report_vote` or `report_withdraw`.
- `GET /api/assistant/contact` returns `{ contact }`, the server's `ASSISTANT_CONTACT` or `null`; the
  widget links to it with `mailto:` and hides the contact links when it is `null`.
- `POST /api/assistant/feedback` with `{ rating, consent, messages?, comment? }`; `messages` only
  for 👎 with consent, `comment` (what wasn't helpful) for 👎 with or without it. Each answer is rated on its own: `messages` is the conversation up to and
  including the rated answer.

Error texts: the chat endpoint's `message` is already localized and shown as is; the texts for its
codes live under `assistant.errors.<CODE>` on the backend branch. This branch only adds
`assistant.errors.generic`, `NETWORK` and `INTERRUPTED` (a stream that closed without `done`), all client-side. Apply errors: the widget sends
its `locale`, so the server's `message` is localized too. The card prefers its own texts under
`assistant.proposal.errors.<CODE>` and shows the server's message for any other code.
