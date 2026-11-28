# Expert Directory

The page `/manage/experts` helps admins find people who could teach, speak or
mentor again. Terms (**Expert**, **Expert Role**, **Last Active**, **Expert
Note**, **Do Not Contact**) are defined in `CONTEXT.md`. Legal basis and
partner access: `docs/adr/0003-expert-notes-legal-basis-and-partner-access.md`.
Semantic search: `docs/adr/0004-semantic-expert-search.md`.

The main job of the page is **finding people by topic** ("who could talk about
X?"). Looking up a known person is the second job.

## Who sees what

| Viewer | Experts listed | Expert Notes |
|--------|----------------|--------------|
| Admin | every Expert | all notes |
| Org Admin (any manage capability) | Experts of courses in their organization's programs | notes of their own organization |

Org admins never see Experts who only worked with other organizations. Giving
them access to all Experts would need each Expert's opt-in and is not planned
(ADR 0003).

## Phase 1 — directory basics (one PR together with the pagination fix)

- **Experts** include project mentors and achievement-option mentors besides
  instructors and speakers; each role in the expanded row says which kind it is.
- **Columns**: photo, first name, last name, organization, last active (year).
- **Default order**: newest **Last Active** first (admins). Clicking a column
  sorts all Experts on the server, not just the visible page.
- **Profile button**: opens `externalProfile` (LinkedIn, Xing or any URL) in a
  new tab. When it is empty, a "search on LinkedIn" button opens a LinkedIn
  people search for the Expert's name and organization. Profile URLs found
  that way are **not stored**: `externalProfile` is the person's own field and
  shown publicly on course pages.
- **Contact**: a `mailto:` button per row, a bulk action that opens the admin's
  mail client with the selected Experts in BCC, and a `matrix.to` chat link when
  the Expert has a `matrixUserHandle`. Hidden for **Do Not Contact**.
- **Match explanation**: when searching, each row says where the search words
  were found ("Course description: Deep Learning (2024)"), with the words
  highlighted; the matching roles are marked in the expanded row. Worked out in
  the browser from the role texts the page already loads.
- **Expert Notes**: a log of dated entries with the author's name. Authors edit
  and delete their own entries, admins can delete any (needed for access and
  erasure requests); edited entries say so.
- **Do Not Contact**: set by admins and by org admins of the Expert's courses,
  removed only by admins. Such Experts stay in the list, greyed out.
- **CSV export**: the visible columns of all matching Experts, without notes;
  Experts marked **Do Not Contact** are left out.
- **Privacy policy**: a section on the Expert Directory. Only the policy's
  "Stand" date changes; the one-time notice is deferred to the next material
  update (see "Pending for the next notice" in `docs/LEGAL_DOCUMENTS.md`).

No filters and no tags for now: hand-maintained tags tend to go stale, and
semantic search (phase 2) covers finding people by topic.

## Phase 2 — semantic search

- One embedding per **Expert Role** source (course, session, project,
  achievement option) from its title and description; **Expert Notes are never
  embedded**. Table `ExpertRoleEmbedding`, view `ExpertRoleSource`.
- Google Vertex AI (`gemini-embedding-001`, 768 dimensions) in the region
  production runs in, stored with `pgvector`. The cron trigger
  `sync_expert_embeddings` (node function `syncExpertEmbeddings`) keeps the
  vectors in step nightly and backfills on its first runs; new courses and
  sessions show up in semantic matches the next day. The same job also embeds
  every project for the projects overview's search (ADR 0009).
- **Hybrid results, one ranked list**: a search of three or more characters
  shows the people whose fields hold every search word (up to 300 for admins,
  100 for org admins, the most recently active first) together with the
  people behind the 200 roles closest in meaning, ranked in the browser. A
  search for a name or email comes first; everyone else is ordered by
  reciprocal rank fusion (k = 60) of their keyword rank (title hits weigh
  more than description hits, and a title repeated across semesters counts
  once) and their semantic rank, then by Last Active.
  A Match column says whether a row matched by keyword, by meaning (with the
  similarity) or both; the expanded row shows the keyword excerpts and the
  closest similar roles. Shorter searches keep the server-paged keyword table.
  The action `semanticExpertSearch` only returns source ids, so org admins
  still only see the experts of their own courses.
- Configuration of `callNodeFunction`: `EMBEDDING_PROVIDER` (`vertex`, `fake`
  for local development, or empty to turn it off), `EMBEDDING_LOCATION`,
  optional `EMBEDDING_PROJECT_ID`, `EMBEDDING_MODEL` and
  `EXPERT_SEARCH_MIN_SIMILARITY`.

## Not planned

- Org admins seeing Experts of other organizations (needs opt-in, ADR 0003).
- Tags, filters, "invite as speaker" from the directory.
