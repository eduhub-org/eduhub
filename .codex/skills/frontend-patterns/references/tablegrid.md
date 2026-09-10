# EduHub TableGrid Notes

Use `frontend-nx/apps/edu-hub/components/common/TableGrid/` as the first stop
for table work.

## Built-in Controls

Check these before adding a control of your own around a table:

- `showGlobalSearchField` with `refetchFilter` / `createMultiWordSearchCondition` for search
- `filters` for multi-select facet filters in the toolbar — the caller owns the selection and
  turns it into query variables; several selected values read as "any of them"
- `bulkActions` with `onBulkAction` for actions over selected rows (adds the checkbox column)
- `deleteMutation`, or `onRowDelete` where deleting a row takes more than one mutation, for the
  row delete column; both share the confirmation and error dialogs
- `expandableRowComponent` for row detail, or `rowHref` / `onRowNavigate` to open a full page

Omitting a control's props leaves it out, which is how one is limited to a role.

## Key Rules

- memoize columns
- use `size` rather than legacy width metadata
- reset paging when filters or page size change
- let `generateDeletionConfirmationQuestion` name what a row delete removes
- keep hook and component page-size behavior aligned
- do not manually rebuild functionality that `useTableGrid` already handles

## When Mobile Matters

If a table is too dense for smaller screens:

- reduce the column set
- move secondary information into the main column cell
- consider a card renderer instead of a forced wide table
