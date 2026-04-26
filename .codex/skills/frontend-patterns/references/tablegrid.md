# EduHub TableGrid Notes

Use `frontend-nx/apps/edu-hub/components/common/TableGrid/` as the first stop
for table work.

## Key Rules

- memoize columns
- use `size` rather than legacy width metadata
- reset paging when filters or page size change
- keep hook and component page-size behavior aligned
- do not manually rebuild functionality that `useTableGrid` already handles

## When Mobile Matters

If a table is too dense for smaller screens:

- reduce the column set
- move secondary information into the main column cell
- consider a card renderer instead of a forced wide table
