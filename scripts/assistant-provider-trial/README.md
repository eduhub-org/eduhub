# Assistant provider trial

Compares LLM providers for the **Assistant** (ADR 0005, issue #2191) on the
same test set: STACKIT vs IONOS with Qwen3.8 27B, plus Gemma 4 31B on STACKIT.
Python 3 standard library only.

## What it measures

| Column | Meaning |
|--------|---------|
| Tools OK (1st try / with retry) | The expected tool was called with the expected arguments, and no forbidden tool was called. "With retry" allows one invalid call that is answered with a validation error, as the backend will do (#2193). |
| Invalid calls, tool markup in text | Arguments that don't parse or don't match the schema; `<tool_call>` text instead of a real tool call. |
| German "du", "Sie"/mixed | Address form in German answers (regex heuristic, check the flagged ones by hand). |
| Language match | Answer in the language of the question. |
| TTFT, Total | Time to first streamed token (incl. reasoning), and total time over all rounds of a case. |
| Tokens/conv., €/conv. | Tokens summed over all rounds of a case, priced with `price_eur_per_mtok`. |
| 429s, Errors | Rate-limit hits (retried with backoff) and failed cases. |

Answer quality is rated by hand: fill in `rating` (1–5) in `answers.csv`.

## Files

- `cases.json`: 27 test cases in German and English: platform and error questions,
  "my data" (waitlist, invitation deadline, attendance, certificates), catalogue,
  out-of-scope requests and Organizer tasks (texts from notes, settings, Sessions,
  including Sessions locked by registrations).
- `tools.json`: mock tools that follow the planned Assistant tools (#2193)
  and course-setup MCP operations (ADR 0006), with fixed fictional results.
  Once the MCP server exists, replace them with its real tool list and run again.
- `system_prompt.md`: the system prompt under test.
- `providers.example.json`: targets; copy it to `providers.json` (git-ignored).

## Run

```bash
cd scripts/assistant-provider-trial
cp providers.example.json providers.json   # fill in model ids and prices
export STACKIT_API_KEY=... IONOS_API_TOKEN=...
python3 run_trial.py --list-models          # find the exact model ids
python3 run_trial.py --repeat 3             # all targets, 3 runs per case
python3 run_trial.py --targets ionos-qwen --only de-mydata-01,de-org-sessions-01
```

Results go to `results/<timestamp>/` (git-ignored): `summary.md`, `answers.csv`, `raw.jsonl`.
Provider options such as turning off Qwen's thinking mode go in `extra_body`
(e.g. `{"chat_template_kwargs": {"enable_thinking": false}}`, if the provider supports it).
Record the chosen provider and model, and the key numbers, in ADR 0005.
