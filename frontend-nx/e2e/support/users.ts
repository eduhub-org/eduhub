/**
 * Accounts seeded into the development Keycloak realm
 * (`keycloak/imports-dev/edu-hub.json`) and the Hasura seed data
 * (`backend/seeds/default/initial_seeds.sql`).
 *
 * These are development-only fixtures for a throwaway container, not secrets:
 * the same credentials are already committed in the realm export and documented
 * in AGENTS.md. `E2E_USER_PASSWORD` exists only so a differently seeded stack
 * can be pointed at without touching the specs.
 */
const password = process.env.E2E_USER_PASSWORD ?? 'dev';

export type E2EUser = {
  email: string;
  password: string;
  /** Hasura roles the account's JWT carries, lowercase (`types/enums.ts`). */
  roles: string[];
};

export const users = {
  /** Platform admin: holds `user`, `instructor` and `admin`. */
  admin: {
    email: 'admin@example.com',
    password,
    roles: ['user', 'instructor', 'admin'],
  },
  /** Plain learner: holds `user` only. */
  user: {
    email: 'user@example.com',
    password,
    roles: ['user'],
  },
} satisfies Record<string, E2EUser>;
