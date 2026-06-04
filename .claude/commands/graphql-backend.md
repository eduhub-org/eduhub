Coordinate GraphQL schema and document changes across EduHub's layers.

## Critical hook rule

`useAuthedQuery` is **deprecated** — it currently aliases to `useRoleQuery`,
but new code must call a role-aware hook directly so the Hasura
`x-hasura-role` header matches the actual caller. The role injection lives in
`frontend-nx/apps/edu-hub/config/apollo.ts`.

Use these hooks (defined in `hooks/authedQuery.ts` and
`hooks/authedMutation.ts`):

```typescript
useRoleQuery(QUERY, options)        // current session role
useRoleMutation(MUTATION, options)

useAdminQuery(QUERY, options)       // explicit admin
useAdminMutation(MUTATION, options)

useInstructorQuery(QUERY, options)  // explicit instructor
```

Role values are lowercase (`AuthRoles` enum in `types/enums.ts`):
`admin`, `instructor`, `user`, `anonymous`.

## Query layout

```
frontend-nx/apps/edu-hub/queries/
  *.ts                # gql`...` documents grouped by entity
  __generated__/      # codegen output — do not edit
```

Existing files cover most entities (e.g. `Project.ts`, `Course.ts`). Add new
fragments and queries to the matching entity file when possible.

## Standard patterns

```typescript
const { data, loading, error, refetch } = useRoleQuery<MyQuery, MyQueryVars>(
  MY_QUERY,
  { variables: { id }, skip: !id }
);

const [updateProject] = useRoleMutation(UPDATE_PROJECT, {
  onError: (err) => console.error(err),
  refetchQueries: [{ query: MY_PROJECT_BY_COURSE, variables: { courseId } }],
});
```

- Use fragments for repeated field selections.
- Use `skip` to gate queries on a variable being defined.
- Fetch only the columns the caller's role is allowed to read.

## Hasura permissions

Per-role permissions live in `backend/metadata/databases/default/tables/public_*.yaml`:

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

- Never add an `admin` block — admin has full access by default in this repo.
- Row-level `filter` must scope the query to data the role is allowed to see
  (e.g. own user, own course).
- When you add a field to a fragment, check that every role that ever reads
  the fragment has that column in its `select_permissions`.

## Schema-change coordination

Any schema-affecting change must cross five layers:

1. SQL migration in `backend/migrations/default/...` (see `/create-migration`)
2. Hasura metadata YAML in `backend/metadata/databases/default/tables/`
3. GraphQL documents in `frontend-nx/apps/edu-hub/queries/`
4. Regenerated types via `/regenerate-types`
5. `functions/` impact scan (`rg "<name>" functions/`) and updates

## Apply after editing

```bash
docker compose exec hasura hasura-cli migrate apply --database-name default
docker compose exec hasura hasura-cli metadata apply

cd frontend-nx && GRAPHQL_URI=http://localhost:8080/v1/graphql yarn apollo

rg "OldName|oldField" frontend-nx functions
```

## Output reporting

When you finish a GraphQL-related change, state which layers were affected:
1. GraphQL documents (queries/mutations/fragments)
2. Metadata or permissions
3. Generated types
4. Downstream `functions/` consumers
