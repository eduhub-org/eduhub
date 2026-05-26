Run ESLint on the EduHub frontend.

## Command

Run from `frontend-nx/` (host, not container):

```bash
yarn lint           # report only — matches CI
yarn lint --fix     # auto-fix where possible
```

## Prerequisites

- Node 20 (`nvm use 20`)
- Yarn 3.4.1 (Corepack-managed; the repo provides `.yarnrc.yml`)

## Notes

- The lint config targets the `edu-hub` app; output mirrors what the
  GitHub Actions CI lint job reports.
- Configs live at `frontend-nx/.eslintrc.json` and
  `frontend-nx/apps/edu-hub/.eslintrc.json`.
- Fix all errors before requesting review. Warnings are tolerated but should be
  acknowledged in the PR description if you intentionally leave them.
- For type-only checks: `yarn type-check` from `frontend-nx/`.
