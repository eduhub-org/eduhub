# EduHub Semantic Release Notes

## Actual Behavior

Source files:

- `frontend-nx/.releaserc.json`
- `.github/workflows/release.yml`

Current active behavior:

- semantic-release is configured only for `production`
- GitHub Actions runs the release workflow only on `push` to `production`
- release notes are generated from conventional commits
- release automation updates versioned files across the monorepo

## Important Drift

Some repo docs still describe older `develop` and `staging` release channels.
Do not treat those docs as the final source of truth when advising on release
behavior. Use the actual config files above.

## Operational Implications

- `develop` and `staging` are still useful promotion branches
- only `production` creates version tags and GitHub releases
- merge-message wording still matters because it affects changelog quality and
  can matter when squash merges collapse many commits into one
