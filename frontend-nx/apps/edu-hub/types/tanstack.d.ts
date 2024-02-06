import { Row } from '@tanstack/table-core';

declare module '@tanstack/table-core' {
  interface ColumnMeta<TData extends RowData, TValue> {
    width?: number;
    className?: string;
  }
}
