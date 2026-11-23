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

## Backend contract (agreed with #2193)

## 1. Chat: `POST /api/assistant/chat`
Auth: NextAuth session cookie (same origin). Header `x-hasura-role: <current role>` (same as /api/mcp).
Request JSON:
```json
{
  "locale": "de",
  "messages": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "...",
      "proposals": [{ "proposedChangeId": "...", "kind": "course_texts", "courseId": 12, "status": "PROPOSED|APPLIED|DISCARDED|FAILED" }] }
  ],
  "pageContext": {
    "path": "/manage/course/12",       // asPath without query
    "route": "/manage/course/[courseId]", // Next route pattern
    "courseId": 12,                       // optional
    "sessionId": 34,                      // optional
    "errorMessage": "..."                 // optional, the visible error
  }
}
```
`proposals` on assistant messages tell the model what the Organizer did with earlier proposals.

Response: `text/event-stream`; each event is `event: <type>\ndata: <json>\n\n`:
- `delta`    `{ "text": "..." }`  — append to the reply (Markdown, links allowed)
- `proposal` `ProposedChangeResult` from lib/mcp/operations.ts as-is
             `{ status:"PROPOSED", proposedChangeId, kind, courseId, before, after, expiresAt, message }`
- `error`    `{ "code": "UNAUTHENTICATED|RATE_LIMITED|SPENDING_CAP|TOO_LONG|PROVIDER|INTERNAL", "message": "..." }`
             then the stream ends. Widget shows a translated text per code, `message` as fallback.
- `done`     `{}`
Pre-stream failures (401/413/429 …) may instead return JSON `{ "error": { code, message } }` with that status.

## 2. Apply / discard: `POST /api/assistant/proposals`
The widget's buttons call this directly; NO LLM in the loop. The model must NOT get
`apply_proposed_change` as a tool, so only the Organizer's click can save.
Both buttons are disabled while a request is in flight and nothing retries
automatically (a duplicate apply of a stateless create_course proposal could
create two courses). After discard the widget forgets the proposedChangeId
(discard doesn't revoke it server-side), so later `proposals` entries may omit it.
Request `{ "proposedChangeId": "...", "action": "apply" | "discard" }` + same auth/role header.
Response 200: result of applyProposedChange / discardProposedChange
(`{ status:"APPLIED", kind, courseId }` / `{ status:"DISCARDED", message }`).
Error 4xx/5xx: `{ "error": { "code": "<OperationError code: STALE|EXPIRED|FORBIDDEN|INVALID|…>", "message": "..." } }`.

## 3. Feedback: `POST /api/assistant/feedback`
`{ "rating": "up" | "down", "consent": boolean, "messages"?: [...same shape as chat...] }`
`messages` is sent ONLY when rating=down AND consent=true; otherwise just an anonymous count.
Response 204 (or `{ error }`).

## Contact when it can't help
Model puts a contact link in its text; the widget also shows a static "Contact" link in the panel footer.
