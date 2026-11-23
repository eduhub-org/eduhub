# Assistant backend

The server side of the **Assistant** (issue #2193, ADR 0005): a streaming chat endpoint that
calls an OpenAI-compatible model (Gemini Flash on Vertex AI, in the EU) and runs tools as the
person chatting.

| File | What it does |
|------|--------------|
| `config.ts` | All settings from the environment; refuses Vertex's global endpoint |
| `provider.ts` | Chat Completions client (SSE, `store: false`), and the `fake` provider |
| `credentials.ts` | Vertex AI token from the metadata server, cached and refreshed |
| `prompt.ts` | System prompt: an AI with no persona, "du", on-screen words, contact |
| `userTools.ts` | Read tools over the asker's own data and the public catalogue |
| `courseSetupTools.ts` | The EduHub MCP server's tools (ADR 0006), in-process, for Organizers |
| `chat.ts` | The tool loop: rounds, one retry after an invalid tool call |
| `limits.ts` | Per-user rate limit, message and conversation length |
| `spending.ts` | Monthly spending cap (`AssistantMonthlyUsage`) |
| `metrics.ts` | Anonymous metrics, one JSON log line per request |
| `handler.ts` | `POST /api/assistant/chat` (SSE) |
| `proposals.ts` | `POST /api/assistant/proposals` (apply/discard from the widget) |
| `feedback.ts` | `POST /api/assistant/feedback` (👍/👎; 👎 conversation with consent) |
| `server.ts` | Production wiring (session, Hasura URL, singletons) |

## Endpoints

Agreed with the widget (#2194). All three need a NextAuth session (same-origin cookie) and take
the role in use from the `x-hasura-role` header, as `/api/mcp` does (`user` without one).

### `POST /api/assistant/chat`

The server keeps no conversation, so the browser sends it each time:

```json
{
  "locale": "de",
  "messages": [
    { "role": "user", "content": "Bitte neue Termine" },
    { "role": "assistant", "content": "…", "proposals": [{ "kind": "sessions", "courseId": 12, "status": "APPLIED" }] },
    { "role": "user", "content": "Danke! Und die Beschreibung?" }
  ],
  "pageContext": { "path": "/manage/course/12", "route": "/manage/course/[courseId]", "courseId": 12, "sessionId": 34, "errorMessage": "…" }
}
```

`proposals` on assistant messages (status `PROPOSED`, `APPLIED`, `DISCARDED` or `FAILED`) tell the
model what the Organizer did; it gets them as a note in the text, never the signed id.
Course-setup tools are offered for `instructor`, `org_admin` and `admin`, if the token allows the
role.

Refusals before streaming are JSON `{ "error": { "code", "message" } }`, the message in `locale`
(texts in `locales/*.json` under `assistant.errors`):

| Status | Codes |
|--------|-------|
| 400 | `INVALID_REQUEST`, `MESSAGE_TOO_LONG`, `CONVERSATION_TOO_LONG` |
| 401 | `NOT_LOGGED_IN` |
| 403 | `ROLE_NOT_ALLOWED`, `IMPERSONATING` |
| 429 | `RATE_LIMITED_SHORT`, `RATE_LIMITED_DAILY` (with `Retry-After`) |
| 503 | `OFF`, `SPENDING_CAP_REACHED`, `UNAVAILABLE` |

Otherwise the reply streams as Server-Sent Events, `data` always JSON:

| Event | Data |
|-------|------|
| `delta` | `{ "text" }`, a piece of the reply (Markdown) |
| `tool` | `{ "name", "status": "running" \| "done" \| "failed" }` (optional to show) |
| `proposal` | the MCP `ProposedChangeResult` as-is: `{ status, proposedChangeId, kind, courseId, before, after, expiresAt, message }` |
| `error` | `{ "code": "TOOL_CALL_FAILED" \| "BUSY" \| "UNAVAILABLE", "message" }` |
| `done` | `{}`, always last |

### `POST /api/assistant/proposals`

`{ "proposedChangeId", "action": "apply" | "discard" }` from the widget's buttons. Only this saves a
Proposed Change: the model is never offered `apply_proposed_change` or `discard_proposed_change`
and never sees the signed id. It runs the MCP operations with the user's token and role. 200 with
the result (`{ status: "APPLIED", kind, courseId, … }` / `{ status: "DISCARDED", … }`), or
`{ "error": { "code", "message" } }` with the OperationError code: 400 `INVALID`/`NO_CHANGE`,
401, 403 `FORBIDDEN`/`ROLE_NOT_ALLOWED`, 404, 409 `STALE`/`ALREADY_APPLIED`/`REGISTRATIONS_EXIST`,
410 `EXPIRED`, 502 `HASURA_ERROR`.

### `POST /api/assistant/feedback`

`{ "rating": "up" | "down", "consent": boolean, "messages"?: [...], "comment"?, "route"?, "locale"? }`.
A rating alone is only counted. With `rating: "down"` and `messages`, the conversation (text only)
is stored in `AssistantFeedback` without a user id, and only with `consent: true` (else 400
`FEEDBACK_CONSENT_REQUIRED`). The `user` role may insert, nobody but admin may read; the
`delete_expired_assistant_feedback` cron deletes rows after 30 days. Answers 204.

## Acting as the asker

- Own-data tools call Hasura with the asker's Keycloak token under the `user` role, and every query
  is pinned to the asker's user id from the session. No tool takes a user id (strict schemas). The
  pin matters: the `user` role includes `user_access_others`, which lists other people's
  Registrations (ids only) for a query without a user filter.
- Course-setup tools act with the asker's token and chosen role through the MCP operations; Hasura
  enforces the rest. The admin secret is only used for the spending totals, never by a tool.
- While an admin views the platform as someone else, the Assistant is off (`IMPERSONATING`).

## Configuration

| Variable | Default | Meaning |
|----------|---------|---------|
| `ASSISTANT_LLM_PROVIDER` | off | `vertex`, `openai` (any OpenAI-compatible API) or `fake` |
| `ASSISTANT_LLM_BASE_URL` | | e.g. `https://aiplatform.eu.rep.googleapis.com/v1/projects/P/locations/eu/endpoints/openapi`; the global endpoint is refused |
| `ASSISTANT_LLM_MODEL` | | e.g. `google/gemini-3.8-flash` |
| `ASSISTANT_LLM_API_KEY` | | static key; for `vertex` only to override the metadata-server token (local test with `gcloud auth print-access-token`) |
| `ASSISTANT_LLM_PRICE_INPUT_EUR_PER_MTOK`, `…_OUTPUT_…` | | required for a paid provider, else it stays off |
| `ASSISTANT_LLM_EXTRA_BODY` | `{}` | JSON merged into each request, e.g. `{"reasoning_effort":"low"}` |
| `ASSISTANT_LLM_STRIP_SCHEMA_KEYS` | | comma-separated JSON-schema keywords the provider rejects |
| `ASSISTANT_MONTHLY_SPEND_CAP_EUR` | 50 | monthly cap (Europe/Berlin calendar month) |
| `ASSISTANT_RATE_LIMIT_SHORT`, `…_SHORT_MINUTES`, `…_DAILY` | 20, 10, 100 | messages per user per window |
| `ASSISTANT_MAX_MESSAGE_CHARS` | 4000 | per user message |
| `ASSISTANT_MAX_CONVERSATION_MESSAGES`, `…_CHARS` | 40, 60000 | per conversation |
| `ASSISTANT_MAX_TOOL_ROUNDS` | 6 | model rounds per reply |
| `ASSISTANT_CONTACT` | `edu-support@opencampus.sh` | named when the Assistant can't help |

The rate limit is kept in memory per server instance (no user ids stored); with several Cloud Run
instances a person can get up to that multiple. The spending cap is global, in the database.

## Local development

`docker-compose.yml` sets `ASSISTANT_LLM_PROVIDER=fake`: it echoes, and a message
`/tool <name> <json>` makes it call that tool (also with invalid JSON, to see the retry), e.g.
`/tool get_my_registrations {}`. Without `HASURA_ADMIN_SECRET` the spending totals are kept in
memory.

## Not yet

- `search_knowledge` arrives with the knowledge index (#2195).
- The waitlist position: participants can't see it in Hasura today, so the Assistant reports the
  waitlist status and the number of people waiting.
