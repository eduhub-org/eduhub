# ADR 0004: Semantic expert search with per-role embeddings from Vertex AI

## Status
Accepted (implementation in a follow-up PR)

## Context

Admins mostly look for experts by topic, but keyword search only finds the
exact words of a course or session text. Hand-maintained tags were considered
and rejected: they tend to go stale. The platform has no embedding or LLM
setup yet.

## Decision

1. **One embedding per Expert Role**, from the course or session title and
   description. A person's score is that of their best-matching role, so the
   result can say which role it is similar to.
2. **Expert Notes are never embedded.** Only course and session texts leave the
   database, and those are public anyway.
3. **Provider: Google Vertex AI embeddings**, in the region production runs in.
   Production already runs on GCP, so no new processor or data processing
   agreement is needed. The model must handle German and English.
4. **Storage: `pgvector`** in the existing Postgres database (supported on
   Cloud SQL).
5. **Hybrid results:** exact keyword hits first, then semantic hits labelled
   "similar". Without a search the directory keeps its Last Active order.
6. **Freshness:** a Hasura event trigger re-embeds a course or session when its
   text changes; a one-off script backfills existing roles.

## Consequences

- Deploying needs GCP setup first: the Vertex AI API, IAM for the function
  that calls it, and the `pgvector` extension on Cloud SQL.
- Each search costs one embedding call for the query.
- Swapping the model means re-embedding every role; the model name is stored
  with each vector so mixed generations can be detected.
