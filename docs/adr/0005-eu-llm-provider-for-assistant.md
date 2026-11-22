# ADR 0005: The Assistant runs on open-weight models from an EU company

## Status
Accepted; provider pending a trial

## Context

The **Assistant** answers questions with the asker's own data (registrations,
attendance, invitations) and helps **Organizers** set up courses. Its prompts
therefore carry personal data. The mid-term goal is that no user data is
processed by US companies, because of the CLOUD Act; production still runs on
GCP and expert search already uses Vertex AI (ADR 0004).

## Decision

1. **Provider: an EU-headquartered company with inference on EU servers.**
   EU regions of a US company (e.g. Vertex AI in europe-west1) do not meet the
   bar. Candidates are STACKIT and IONOS (both German, no prompt storage, no
   training on inputs); the provider is chosen after a short trial with the real
   tools and German "Du" prompts, and needs a signed AVV and a C5 certificate
   that covers the product. The other provider, serving the same model, is the
   fallback.
2. **Open-weight models behind an OpenAI-compatible API.** Default model
   Qwen3.8 27B, which every candidate (STACKIT, IONOS, OVHcloud, Scaleway)
   hosts and vLLM can serve. Base URL, key and model are configuration, so
   switching provider or self-hosting changes no code.
3. **Managed API, not self-hosted.** A GPU server for a ~27B model costs about
   €1,000/month plus operations, which buys 1.5–2 billion tokens from the API.
   We revisit when usage approaches that.
4. **Built in EduHub, not an adopted chat platform.** LibreChat, Open WebUI or
   Chatwoot would bring their own users and storage and cannot act within
   EduHub's Hasura roles; the Assistant's tools act as the person chatting.

## Considered options

- **Vertex AI / Gemini** (already in use): rejected, US company.
- **Mistral La Plateforme**: rejected for now. EU inference needs a separate
  endpoint, inputs are kept 30 days by default, and subprocessors outside the
  chosen region (reportedly US clouds) are allowed.

## Consequences

- 24–32B models call tools less reliably than large proprietary models; every
  change goes through a **Proposed Change** the Organizer applies, and tool
  calls are retried.
- Conversations are not stored on our side; only a conversation rated 👎 is kept,
  with consent, for 30 days. The privacy policy names the provider, and the
  widget says that the Assistant is an AI.
- The Assistant is for logged-in users only; anonymous visitors see a prompt to
  log in. Each person has a rate limit and the platform a monthly spending cap.
- Expert search (ADR 0004) can move to the same provider later; it needs an
  OpenAI-compatible embeddings provider and a full re-embed.
