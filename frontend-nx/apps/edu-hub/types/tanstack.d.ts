import type { RowData } from '@tanstack/react-table';

declare module '@tanstack/table-core' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    width?: number;
    className?: string;
    /** When set, header and cell content are centered in the column (e.g. icon columns). */
    align?: 'center';
    /** TableGrid leaves the column out below this breakpoint (lg = 1024px, xl = 1280px). */
    hideBelow?: 'lg' | 'xl';
  }
}
