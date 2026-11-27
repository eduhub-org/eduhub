# ADR 0009: Semantic project search on the projects overview

## Status
Accepted, implemented

## Context

Admins and Org Admins look for projects on the projects overview by topic, but
the keyword search only finds the exact words of a title, tagline,
description, person, course or program. ADR 0004 already embeds texts with
Vertex AI, stores them with `pgvector` and ranks keyword and semantic hits
together for the expert directory. The projects overview should search the
same way.

## Decision

1. **A separate table, `ProjectEmbedding`, with one vector per project** from
   its title, tagline and description, and the view `ProjectEmbeddingSource`
   over **every** project. `ExpertRoleEmbedding` only holds projects with
   mentors, as Expert Role sources (ADR 0004, point 7), and its stale-vector
   rule drops a project once its last mentor leaves. Sharing it would tie one
   search's coverage to the other's rules. So a mentored project is
   deliberately embedded twice; the cost is one extra embedding per mentored
   project and a few kilobytes per vector.
2. **Refreshed nightly only**, by a second pass of the existing job
   (`sync_expert_embeddings` → `syncExpertEmbeddings`). Both passes use the
   same provider configuration, drop vectors of another model first and then
   embed within one shared time budget (two minutes per run; the expert pass
   goes first). A new or changed project is found by meaning the next day; by
   its words straight away. One cron trigger was kept over a second one: the
   provider, budget and batching are the same, and two jobs would have to
   split callNodeFunction's timeout between them anyway. A deleted project
   takes its vector along (`ON DELETE CASCADE`).
3. **Role scope before the limit.** The action `semanticProjectSearch` (admin
   and org_admin only) calls `match_projects` with the admin secret and
   returns project ids and similarities only. For an Org Admin it passes two
   scopes, like the Project permission: the organizations whose grants have
   **Can manage courses** (for course programs) and those with **Can manage
   events** (for event programs). `match_projects` keeps only projects listed
   in a course of a matching program, **before** the 200 closest are taken, so
   projects the caller can't see (other organizations', or the other program
   type) can't crowd them out.
   Every project is listed in a course, so there is no path through
   `Project.organizationId`. The overview then loads the matched projects by
   id under the caller's own role and filters, so the action never widens
   what a caller can read.
4. **Ranked mode on the overview** for searches of three or more characters:
   up to 300 keyword candidates (in the overview's order) and the matched
   projects that pass the program, course-group and role filters are merged
   with the shared reciprocal rank fusion of ADR 0004 (`rankSearchResults`)
   and paged in the browser. The status chips filter and count that list in
   the browser. A note says when semantic search is unavailable (failed or
   turned off); the list then holds keyword hits only. Shorter searches keep
   the server-paged list sorted by Project Status.

## Consequences

- No new infrastructure: the `vector` extension, Vertex AI access and the
  `EMBEDDING_*` settings of ADR 0004 cover it. The first nights backfill the
  existing projects within the shared time budget.
- Each ranked search costs one embedding call for the query.
- Swapping the model re-embeds both tables; both store the model key.
- An Org Admin whose only grants are **Can manage degrees** or **Can manage
  settings** sees degree-program projects in the list but gets no semantic
  matches; their search stays keyword-only.
