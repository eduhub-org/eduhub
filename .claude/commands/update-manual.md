Check whether a change going into `develop` needs an update of the EduHub
manual (`docs/manual`), and make that update in the same PR.

The manual is shown in the app at `/help` and is the main source of the
Assistant's knowledge index, so a stale page means wrong answers to users.

## When to run

- Before opening or merging a PR into `develop`, and before merging a
  `develop` → `staging` promotion (to catch changes merged without it).
- Whenever a change alters what users see or can do: labels in
  `frontend-nx/apps/edu-hub/locales/*.json`, pages and components under
  `frontend-nx/apps/edu-hub/pages/` or `components/`, permissions in
  `backend/metadata/`, emails, cron jobs or rules in `functions/`, or terms in
  `CONTEXT.md`.

## Steps

1. **List what changed** for users. For a PR branch:
   ```bash
   git fetch origin develop
   git diff --stat origin/develop...HEAD
   git diff origin/develop...HEAD -- frontend-nx/apps/edu-hub/locales CONTEXT.md backend/metadata functions
   ```
   For a promotion, diff `origin/staging...origin/develop` instead. Ignore
   refactors, tests, dev tooling and anything users can't notice.
2. **Find the affected pages.** Search the manual for the old labels, terms
   and routes, in both languages:
   ```bash
   grep -rn "<old label or term>" docs/manual/
   ```
   Also look up the topic in the page list (`docs/manual/{de,en}/*/`): a new
   feature may need a new section or page even if no old text matches.
3. **Update both languages.** `de` and `en` must keep the same pages and the
   same facts. Follow `docs/manual/README.md`:
   - on-screen labels exactly as in the locale files, in **bold**;
   - `CONTEXT.md` terms; German with the informal "Du";
   - platform behaviour only, not the rules of one organization;
   - don't rename files or headings that other pages or the Assistant cite
     unless the content moved; fix links to them if you do.
   A new page needs the full front matter and an entry in its section.
4. **Verify** from `frontend-nx/` (the loader tests check pages exist in both
   languages, links and anchors resolve, and German uses "Du"):
   ```bash
   yarn test apps/edu-hub/lib/manual
   ```
5. **Commit** the manual update in the same PR as the change, e.g.
   `docs: describe <feature> in the manual` (see `/conventional-commits`).

## Output reporting

When invoked, say:
1. which user-visible changes you found (or that there were none)
2. which manual pages you changed or added, per language
3. anything you could not verify from the code and left out
4. whether the manual tests passed
