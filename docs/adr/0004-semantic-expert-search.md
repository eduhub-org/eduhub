# ADR 0004: Semantic expert search with per-role embeddings from Vertex AI

## Status
Accepted, implemented

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
6. **Freshness:** a Hasura cron trigger (`sync_expert_embeddings`, nightly at
   02:00 UTC) embeds new or changed sources for up to two minutes per run and
   drops vectors of removed sources or of another model. The view `ExpertRoleSource` marks
   what needs embedding by comparing an md5 of the text, so the first runs
   backfill an existing database without a separate script. We chose this over
   event triggers on four tables (plus their instructor, speaker and mentor
   links): one job covers every way a text or a role can change, and a day of
   delay does not matter for finding experts.
7. **Only sources with people are embedded:** courses with instructors,
   sessions with speakers, projects and achievement options with mentors.
8. **Local development** uses a `fake` provider that embeds by shared words,
   so the pipeline runs without Google credentials, and the
   `pgvector/pgvector:pg17-trixie` image (same glibc as `postgres:17`, so
   existing volumes keep their collation version).

## Consequences

- Deploying needs the Vertex AI API and `roles/aiplatform.user` for the
  function's service account (both in Terraform) and the `vector` extension on
  Cloud SQL, which the migration creates.
- Each search costs one embedding call for the query.
- Swapping the model means re-embedding every role; the model name is stored
  with each vector so mixed generations can be detected.
