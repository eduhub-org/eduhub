# EduHub Release Config Notes

This reference captures the repo-specific release details that matter when
choosing or reviewing commit messages.

## Actual Configuration

The active semantic-release configuration is defined in:

- `frontend-nx/.releaserc.json`
- `.github/workflows/release.yml`

Important current behavior:

- semantic-release is configured only for the `production` branch
- the GitHub Actions release workflow runs only on `push` to `production`
- release notes are generated from conventional-commit types
- release automation updates:
  - `frontend-nx/package.json`
  - `package.json`
  - `functions/*/package.json`
  - `CHANGELOG.md`
  - `VERSION`
  - `frontend-nx/apps/edu-hub/public/version.json`

## Practical Implications

- Conventional commit subjects still matter on feature branches because they
  shape the eventual release notes and version bump once changes land in
  `production`.
- `feat`, `fix`, and `perf` have release significance.
- Default GitHub merge messages are less informative than explicit
  conventional merge messages.

## Documentation Drift To Remember

Some repo docs still describe older branch-channel behavior such as dev or
staging releases. Do not treat those docs as the final source of truth when
preparing release-sensitive commit messages. Prefer the actual config files.
