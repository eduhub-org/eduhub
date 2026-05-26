Implement authentication and authorization in EduHub correctly
(Keycloak + NextAuth + Hasura + role-aware Apollo hooks).

## Architecture

```
User → Keycloak (realm roles)
     → NextAuth (session, JWT)
     → Apollo authLink injects x-hasura-role + Bearer token   (config/apollo.ts)
     → Hasura (row-level + column-level permissions)
     → Role-aware React hooks (useRoleQuery, useAdminQuery, ...)
```

The Apollo `authLink` (`frontend-nx/apps/edu-hub/config/apollo.ts`) reads the
current role from the auth store and adds it as the `x-hasura-role` header.
Hooks that pin a role (`useAdminQuery`, `useInstructorQuery`) override that
via the operation context.

## Roles

The `AuthRoles` enum (`types/enums.ts`) is **lowercase**:

```typescript
admin | instructor | user | anonymous
```

Hasura permission YAMLs and the `x-hasura-role` header use those exact
strings. Realm role names in Keycloak follow the same casing.

## Critical hook rule

`useAuthedQuery` is deprecated (it now delegates to `useRoleQuery`). New code
must call the role-aware hook directly so the role on the request matches the
caller:

```typescript
// Current user's role — most common
useRoleQuery(QUERY, options)
useRoleMutation(MUTATION, options)

// Force admin / instructor (caller must actually have the role)
useAdminQuery(QUERY, options)
useAdminMutation(MUTATION, options)
useInstructorQuery(QUERY, options)
```

## Session / JWT

```typescript
import { useSession } from 'next-auth/react';

const { data: session, status } = useSession();
const roles = session?.user?.roles ?? [];
const isAdmin = roles.includes('admin');
```

- Treat JWT expiry as a redirect-to-login condition. The role-aware hooks
  already detect `JWTExpired` / `JWSInvalidSignature` and call `signOut(...)`.
  Don't silently swallow auth errors elsewhere.
- Never store tokens in `localStorage`. NextAuth uses HTTP-only cookies.

## Hasura permissions

Each table operation needs explicit per-role permissions in
`backend/metadata/databases/default/tables/public_*.yaml`:

```yaml
select_permissions:
  - role: user
    permission:
      filter:
        ProjectAuthors: { userId: { _eq: X-Hasura-User-Id } }
      columns: [id, title, status]
insert_permissions:
  - role: instructor
    permission:
      check: {}
      columns: [title, courseId]
```

- Do **not** add an `admin` block — admin has full access by default.
- Confirm the `filter` actually scopes data to what the role should see
  (own user, own course, etc.).
- When adding a field to a fragment, check every consuming role can read it,
  otherwise queries succeed for some roles and fail for others.

## Component-level checks

For UI-level gating, check the role on the session, but never rely on UI
alone — the backend permission must also block unauthorized writes.

```typescript
const { data: session } = useSession();
const isAdmin = session?.user?.roles?.includes('admin');

if (!isAdmin) return <AccessDenied />;
```

## Sensitive-change checklist

When changing anything in this area, verify all five layers:

1. Login / NextAuth callback shape
2. Frontend role checks (UI gates)
3. GraphQL hook used (does role match intent?)
4. Hasura metadata `select`/`insert`/`update`/`delete` permissions
5. Both authenticated (correct role) and unauthenticated/lower-role paths

## Other security expectations

- Input validation at every boundary (server-side too — UI validation alone
  is not enough).
- No `dangerouslySetInnerHTML` for untrusted content; sanitize with DOMPurify
  if you must render rich text.
- For postMessage handlers (e.g. Formbricks embed), always validate
  `event.origin` against the configured iframe URL.
- GitHub Actions: pin actions to commit SHA, set minimum `GITHUB_TOKEN`
  permissions per job, add `step-security/harden-runner` to every
  `ubuntu-latest` job, and quote variables in shell scripts. See the cursor
  rule `.cursor/rules/github-actions-security.mdc` for the full checklist.

## Output reporting

When making a security-relevant change, state:
1. which role / permission boundary changed
2. which of the five layers above were updated
3. how unauthorized behavior was verified
