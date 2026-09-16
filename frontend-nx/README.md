# EduHub Frontend

This directory contains the single Next.js frontend app (`apps/edu-hub`).

## Development

From `frontend-nx/` run:

- `yarn start` to run the dev server on `http://localhost:5000`
- `yarn lint` to run ESLint
- `yarn test` to run Jest tests
- `yarn build` to create a production build
- `yarn type-check` to run TypeScript checks
- `yarn apollo` to regenerate GraphQL client types

When the frontends run through Docker Compose, their startup scripts serialize
the shared `yarn` installation before starting each development server. The
lock is released automatically if an installation fails or its container is
stopped, so no manual cleanup is required before restarting either frontend.
