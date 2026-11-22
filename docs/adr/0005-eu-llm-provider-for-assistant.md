# ADR 0005: The Assistant runs on Gemini Flash on Vertex AI, processed in the EU

## Status
Accepted; Gemini model pending a short trial

## Context

The **Assistant** answers questions with the asker's own data (registrations,
attendance, invitations) and helps **Organizers** set up courses, so its
prompts carry personal data. The mid-term goal is to stop having user data
processed by US companies, because of the CLOUD Act. Production runs on GCP,
and expert search already uses Vertex AI (ADR 0004). We postponed moving the
Assistant to an EU provider so it can use the existing Google account,
contract and setup.

## Decision

1. **Model: Gemini Flash on Vertex AI, with ML processing guaranteed in the
   EU.** The candidates are Gemini 3.8 Flash on the `eu` multi-region endpoint
   (preferred) and Gemini 2.5 Flash in europe-west1 (cheaper, older). A short
   trial with the real tools and German "Du" prompts decides between them. The
   `global` endpoint is never used: it gives no control over where requests
   are processed, and the organization policy
   `constraints/gcp.restrictEndpointUsage` should block it.
2. **The Assistant calls Vertex AI through its OpenAI-compatible Chat
   Completions API.** Base URL, credentials and model are configuration, so
   moving to an EU provider later needs no code change, only a prompt retest.
3. **Zero retention on Google's side:** request-response logging off,
   `store=false`, caching off (`disableCache`), and no Grounding with Google
   Search.
4. **Built in EduHub, not an adopted chat platform.** LibreChat, Open WebUI or
   Chatwoot would bring their own users and storage and cannot act within
   EduHub's Hasura roles. The Assistant's tools act as the person chatting.
5. **The knowledge index uses the existing Vertex embeddings**
   (`gemini-embedding-001`, ADR 0004), in its own table.

## Considered options

- **An EU-company provider** (STACKIT or IONOS, both German, with open-weight
  models such as Qwen3.8 27B): this remains the target once user data moves
  off US companies. It was postponed, not rejected.
- **Open-weight models on Vertex AI:** rejected. The managed open models
  (gpt-oss, Gemma 4, DeepSeek, GLM, Llama 4) are served only on the global
  endpoint or in US regions, and managed Qwen3 was retired in October 2026.
  Mistral Small 3.1 runs in europe-west4, but through its own API and with
  undocumented tool calling. Self-deploying with vLLM in the EU costs roughly
  $1.7k–4.5k a month per GPU endpoint, plus the work of running it.
- **Mistral La Plateforme:** rejected. EU inference needs a separate endpoint,
  inputs are kept 30 days by default, and subprocessors outside the chosen
  region are allowed.

## Consequences

- Google is already a processor, so no new data processing agreement is
  needed. The privacy policy still gets an Assistant section, and the widget
  says that the Assistant is an AI.
- Moving to an EU provider later means an open-weight model, which calls tools
  less reliably than Gemini. Every change already goes through a **Proposed
  Change** that the Organizer applies, and tool calls are retried, but prompts
  must be retested before the switch.
- Gemini 3.x costs about 10% more on regional and `eu` endpoints than on the
  global endpoint.
- Conversations are not stored on our side. Only a conversation rated 👎 is
  kept, with consent, for 30 days.
- The Assistant is for logged-in users only; anonymous visitors see a prompt
  to log in. Each person has a rate limit and the platform a monthly spending
  cap.
