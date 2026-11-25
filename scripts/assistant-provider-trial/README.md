# Assistant provider trial

Compares models for the **Assistant** (ADR 0005, issue #2191) on the same test
set: Gemini 3.8 Flash on the Vertex AI `eu` multi-region endpoint vs the
open-weight candidates Gemma 4 26B A4B and DeepSeek V4.1 Flash, all through
Vertex's OpenAI-compatible Chat Completions API. Any other OpenAI-compatible
endpoint works too, e.g. an EU provider hosting the same open-weight models
(OVHcloud, Scaleway). Python 3 standard library only.

Every request is sent with `store: false`. A target on Vertex's `global`
endpoint is refused, since it gives no control over where requests are processed,
unless it sets `"allow_global_endpoint": true` **and** its name contains `global`
(so every result table shows it). That exists only because Gemma 4 and DeepSeek
V4.1 Flash are offered on `global` alone: such a target is for this trial's
fictional cases only and can never serve the Assistant, which still refuses
`global`. If `vertex_global_endpoint_policy` (infrastructure/README.md) is
`dry_run` in the project, these requests show up as expected violations in its
log; under `enforce` they fail, so run global targets in a project without it.

## What it measures

| Column | Meaning |
|--------|---------|
| Tools OK (1st try / with retry) | The expected tool was called with the expected arguments, and no forbidden tool was called. "With retry" allows one invalid call that is answered with the same `INVALID_ARGUMENTS` error the Assistant backend sends. |
| Invalid calls, tool markup in text | Arguments that don't parse or don't match the schema; `<tool_call>` text instead of a real tool call. |
| German "du", "Sie"/mixed | Address form in German answers (regex heuristic, check the flagged ones by hand). |
| Language match | Answer in the language of the question. |
| TTFT, Total | Time to first streamed token (incl. reasoning), and total time over all rounds of a case. |
| Tokens/conv., Cost/conv. | Tokens summed over all rounds of a case, priced with `price_per_mtok` in `currency`. |
| 429s, Errors | Rate-limit hits (retried with backoff) and failed cases. |

Answer quality is rated by hand: fill in `rating` (1–5) in `answers.csv`.

## Files

- `cases.json`: 30 test cases in German and English: platform and error questions,
  "my data" (waitlist, invitation deadline, attendance, certificates), catalogue,
  out-of-scope requests and Organizer tasks (texts from notes, texts in the wrong
  language, settings, adding and moving Sessions, Sessions locked by registrations,
  creating a course). `role` is `user`, `instructor` or `org_admin`.
- `tools.json`: the tool definitions exactly as the Assistant offers them to the
  model: the user tools from `frontend-nx/apps/edu-hub/lib/assistant/userTools.ts`
  and the course-setup tools of the MCP server (`lib/mcp/server.ts`), without
  apply and discard, which the model never gets. Results are fictional mocks in
  the shape the model receives. When a tool changes in the app, copy its new
  definition here.
- `system_prompt.md`: the Assistant's system prompt from `lib/assistant/prompt.ts`;
  the harness fills in the Organizer rules, role, page and page error the same way.
- `providers.example.json`: targets; copy it to `providers.json` (git-ignored).

## Run

```bash
cd scripts/assistant-provider-trial
cp providers.example.json providers.json   # set PROJECT_ID, model ids and prices
gcloud auth login                          # an account with roles/aiplatform.user
python3 run_trial.py --targets gemini-3.8-flash-eu --only de-mydata-01
python3 run_trial.py --repeat 3             # all targets, 3 runs per case
```

Results go to `results/<timestamp>/` (git-ignored): `summary.md`, `answers.csv`, `raw.jsonl`.
Auth: `api_key_command` (here `gcloud auth print-access-token`) is run once and
again after 45 minutes or on a 401; `api_key_env` names an env var with a static
key instead. Model options such as `reasoning_effort` go in `extra_body`. Like the backend, a case gets at most 6 model turns and the last one is
sent without tools; set `max_tool_rounds` on a target to match a different
`ASSISTANT_MAX_TOOL_ROUNDS`. A timeout or broken stream fails that case only. If the
endpoint rejects a JSON-schema keyword in the tool definitions, list it in
`strip_schema_keys` (e.g. `["additionalProperties"]`); the harness still
validates the model's arguments against the full schema.
Record the chosen provider and model, and the key numbers, in ADR 0005.
