# ADR 0008: The Assistant runs on Qwen3.8 27B on the IONOS AI Model Hub

## Status
Accepted; supersedes the model and provider of ADR 0005 (its other decisions stand)

## Context

ADR 0005 put the Assistant on Gemini on Vertex AI and named an EU-company
provider with an open-weight model as the target once user data moves off US
companies. The provider trial (`scripts/assistant-provider-trial/`, 30
fictional cases with the real tools) compared, in November 2026:

| Model | Host | Right tools | "du" | Language | Total p50 | EUR per 1,000 questions |
|---|---|---|---|---|---|---|
| Gemini 3.8 Flash | Vertex AI `eu` | 98% | 100% | 100% | 17.9 s | ~18–29 (2027 prices) |
| DeepSeek V4.1 Flash | (OVHcloud) | 98% | 100% | 100% | 4.8 s | 2.04 |
| Qwen3.8 27B | IONOS | 98% | 98% | 98% | 4.6 s | 4.37 |
| Qwen3.5 397B A17B | IONOS | 95% | 95% | 83% | 15.9 s | 5.65 |
| gpt-oss-120b | IONOS | 82% | 100% | 76% | 5.6 s | 0.91 |
| Gemma 4 26B A4B | (OVHcloud) | 83% | 93% | 82% | 2.0 s | 0.38 |

Qwen3.8 27B reached these figures with the prompt rules from #2223 (reply in
the user's language whatever the page or tools return; use the course of the
page). Gemini is proprietary, so moving it to an EU provider would mean a new
model anyway.

## Decision

1. **Qwen3.8 27B (`Qwen/Qwen3.8-27B`) on the IONOS AI Model Hub**, a German
   company processing in Germany. It is on par with DeepSeek V4.1 Flash,
   about four times faster than Gemini and a fraction of its price, and
   opencampus.sh already has an IONOS account (SEEd AI).
2. **Configuration only:** the app's generic `openai` provider with a static
   API key. Terraform sets `assistant_llm_provider = "ionos"`; the token is the
   sensitive `assistant_llm_api_key`, kept in Secret Manager. Without a key the
   Assistant stays off instead of blocking a deploy.
3. **Vertex stays configurable** (`assistant_llm_provider = "vertex"`) as a
   fallback. The knowledge index keeps the Vertex embeddings (ADR 0004).

## Considered options

- **DeepSeek V4.1 Flash on OVHcloud:** as good and half the price, but it
  needs a new account; IONOS has no DeepSeek. Remains the first alternative.
- **Staying on Gemini:** slower, several times the cost, and a US company.

## Consequences

- IONOS documents that inference runs in Germany and that prompts and
  outputs are not logged or used for training. The data processing agreement
  ("AVV IONOS Cloud", version 11/2026) is part of the IONOS Cloud terms and
  needs no separate signature. Its subprocessor list names IONOS group
  companies for AI Model Hub support and operation: IONOS SE (Germany), IONOS
  Cloud Romania S.R.L. and IONOS Cloud Solutions Spain S.L.U., all in the EU.
  How long IONOS keeps its operational logs (time, model, token count) is to
  be confirmed with IONOS.
- The privacy policy needs the Assistant section ADR 0005 promised, naming
  IONOS as processor, before the Assistant is used in production.
- `store=false` has no effect at IONOS; zero retention rests on its terms.
- Changing the model or provider again means a trial run first.
