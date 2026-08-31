Apply EduHub frontend conventions for components, layout, translations,
TableGrid usage, and responsive behavior.

## Reuse first

Before creating any new UI, check existing shared components:

| Need | Component | Path |
|------|-----------|------|
| Error modal | `ErrorMessageDialog` | `components/common/dialogs/` |
| Confirm/cancel | `QuestionConfirmationDialog` | `components/common/dialogs/` |
| Generic dialog shell | `DialogShell` | `components/common/dialogs/` |
| Toast | `NotificationSnackbar` | `components/common/dialogs/` |
| Tag input | `CreatableTagSelector` | `components/inputs/` |
| Dropdown | `DropDownSelector` (Eduhub + Material variants) | `components/inputs/DropDownSelector/` |
| Text input | `InputField` | `components/inputs/` |
| Data table | `TableGrid` | `components/common/TableGrid/` |

When you reuse one of these, mention it in the PR/commit description.

## Two apps, one component set (edu-hub ↔ StuJo)

`frontend-nx/apps/stujo` (the StuJo job board) is not a separate design system.
The standing goal is that **the apps differ in design tokens, not in forked
components** — reuse grows over time.

- Import shared code with the `@eduhub/*` alias (`tsconfig.base.json`);
  `apps/stujo/next.config.js` enables `experimental.externalDir` for it. The
  app already does this for `@eduhub/config/apollo`,
  `@eduhub/components/AuthStoreUpdater` and `@eduhub/hooks/authentication`.
- **Never copy a component into `apps/stujo` to restyle it.** Every colour in
  `apps/edu-hub/tailwind.config.js` resolves to a `var(--eduhub-*)` token
  defined in `apps/edu-hub/styles/globals.css`; StuJo overrides those same
  token names with its own values in `apps/stujo/styles/globals.css`. Restyling
  is a token change.
- Both apps use `apps/edu-hub/tailwind.config.js`. StuJo's config must extend
  it and its `content` globs must include `../edu-hub/components/**` —
  otherwise Tailwind emits no classes for the shared components and they render
  unstyled.
- Components that call `useTranslations('common')` need their keys present in
  **both** `apps/edu-hub/locales/*.json` and `apps/stujo/locales/*.json`; the
  apps have separate `common` namespaces.
- `DropDownSelector` and `InputField` carry a `variant` prop. It selects a
  *style family*, not an app — with shared tokens, `'eduhub'` is the correct
  variant inside StuJo too.
- StuJo also keeps its own ported Rails layer (`--stujo-*` variables,
  `stujo-*` classes) for page chrome. That stays; it is not a reason to fork a
  shared component. Background: `docs/STUJO_INTEGRATION_PLAN.md` §8.1.

## Component organization

Feature-based, not technology-based:

```
components/pages/CourseContent/Projects/    ✓ feature folder
  index.tsx
  ProjectsTable.tsx
  MyProjectPanel.tsx
  hooks/useProjectActions.ts
```

- Keep components under ~200 lines; extract logic into `use*.ts` hooks.
- Split container (data + Apollo) from presentation (pure UI) when it improves
  readability.
- Avoid deep nesting (max 3-4 levels) and broad prop drilling — lift state or
  use a context.

## TypeScript + memoization

```typescript
import { FC, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';

interface Props {
  courseId: number;
  onSave: (value: string) => void;
  isLoading?: boolean;
}

const MyComponent: FC<Props> = ({ courseId, onSave, isLoading }) => {
  const t = useTranslations('course');
  const handleClick = useCallback(() => onSave('done'), [onSave]);
  // ...
};
```

- Always define explicit prop interfaces; no inline `any`.
- `useMemo` for computed values and column definitions.
- `useCallback` for handlers passed to memoized children.
- `React.memo` for pure presentational components rendered in lists.
- Don't over-memoize trivial leaf components.

## Translations (next-intl)

EduHub uses `next-intl`, not `next-translate`. Import from `'next-intl'`:

```typescript
import { useTranslations, useLocale } from 'next-intl';

const t = useTranslations('course');             // namespace
t('Sessions.show_all_sessions');                  // ComponentGroup.snake_case
const tCommon = useTranslations('common');
tCommon('TableGrid.pagination_text');
```

Key shape: `namespace (camelCase) > ComponentGroup (PascalCase) > key (snake_case)`.

- Add every key to **both** `locales/de.json` and `locales/en.json`.
- German MUST use the informal "Du" form (never "Sie"):
  - ✓ `"Lade deine Datei hoch"`
  - ✗ `"Laden Sie Ihre Datei hoch"`
- Database ENUM values keep their `ALL_CAPS` form as keys
  (`CONFIRMED`, `UNIVERSITY_STUDENT`, `ONLINE`) so they map 1:1 to DB rows.

## TableGrid (TanStack-based)

`components/common/TableGrid/` wraps `@tanstack/react-table`. Use the
`ColumnDef` type from that package (not the `MRT_*` types from
`material-react-table`).

```typescript
import { ColumnDef } from '@tanstack/react-table';
import TableGrid from '../common/TableGrid';

const columns = useMemo<ColumnDef<MyRow>[]>(() => [
  { header: 'ID',    accessorKey: 'id',    size: 80 },
  { header: 'Title', accessorKey: 'title', size: 300, minSize: 200 },
], []);

<TableGrid<MyRow>
  columns={columns}
  data={data}
  loading={loading}
  error={error}
  totalCount={totalCount}
  pageIndex={pageIndex}
  onPageChange={setPageIndex}
  pageSize={pageSize}
  onPageSizeChange={handlePageSizeChange}
  searchFilter={searchFilter}
  onSearchFilterChange={setSearchFilter}
/>
```

Rules:
- Always memoize `columns` with `useMemo`.
- Use the `size` property; the legacy `meta.width` is deprecated.
- Reset `pageIndex` to 0 when filters or page size change.
- Don't manage `offset` manually — `useTableGrid` handles it.

Sizing guidance:

| Content | size |
|---------|------|
| Status / icon | 50-100 |
| Numeric / ID | 80-150 |
| Text content | 200-500 (with `minSize`) |
| Actions | 100-200 |

### useTableGrid hook

```typescript
import { useTableGrid } from '../common/TableGrid/hooks';

const { data, loading, error, searchFilter, pageIndex,
        setSearchFilter, setPageIndex } = useTableGrid({
  queryHook: useAdminQuery,
  query: MY_QUERY,
  queryVariables: { programId },
  pageSize: 20,
  refetchFilter: useCallback((term) => ({
    where: { title: { _ilike: `%${term}%` } },
  }), []),
});
```

Multi-word search:

```typescript
import { createMultiWordSearchCondition } from '../common/TableGrid/utils';

refetchFilter: (term) => ({
  where: createMultiWordSearchCondition(term, ['firstName', 'lastName', 'email']),
});
```

## Responsive design

Mobile-first. For breakpoint-aware behavior use the project's `useMediaQuery`
hook (Material-UI breakpoints) and provide card-style renderers for dense
tables on small screens.

- Minimum touch target: 44 px.
- Don't try to force all desktop columns into mobile width — collapse to a
  card layout or stack labels above values.
- Test forms with mobile keyboards (text vs numeric inputs).

## Output reporting

When you make a frontend change, state which existing shared components and
patterns you reused before introducing anything new.
