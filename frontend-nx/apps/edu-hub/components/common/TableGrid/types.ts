import { ApolloError, DocumentNode } from '@apollo/client';
import { ColumnDef, SortingState } from '@tanstack/react-table';
import { ReactElement } from 'react';

export interface BaseRow {
  id: number;
}

export interface BulkAction {
  value: string;
  label: string;
  group?: string; // Optional group name for grouping menu items
}

export interface TableGridProps<T extends BaseRow> {
  addButtonText?: string;
  data: T[];
  columns: ColumnDef<T>[];
  deleteMutation?: DocumentNode;
  deleteIdType?: 'number' | 'uuidString';
  generateDeletionConfirmationQuestion?: (row: T) => string;
  enablePagination?: boolean;
  error: ApolloError | null | undefined;
  expandableRowComponent?: (props: { row: T }) => ReactElement | null;
  loading: boolean;
  pageSize?: number;
  refetchQueries: string[];
  showCheckbox?: boolean;
  showGlobalSearchField?: boolean;
  onAddButtonClick?: () => void;
  onBulkAction?: (action: string, selectedRows: T[]) => void;
  bulkActions?: BulkAction[];
  totalCount?: number;
  pageIndex: number;
  onPageChange: (index: number) => void;
  searchFilter: string;
  onSearchFilterChange: (value: string) => void;
  onPageSizeChange?: (size: number) => void;
  availablePageSizes?: number[];
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState | ((prev: SortingState) => SortingState)) => void;
  /** When true, uses reduced row padding for more compact table layout */
  compactRows?: boolean;
}

export interface UseTableGridProps<V> {
  queryHook: any; // useRoleQuery or useAdminQuery
  query: DocumentNode;
  queryVariables?: V;
  pageSize?: number;
  debounceMs?: number; // Configurable debounce time in milliseconds
  refetchFilter?: (searchFilter: string) => Record<string, any>;
  sortColumnMapper?: (columnId: string) => string | Record<string, any> | null;
  defaultSort?: Record<string, any>[]; // Default sort when no user sorting is applied
} 

export interface TableGridDeleteButtonProps {
  deleteMutation: DocumentNode;
  id: string | number;
  refetchQueries: string[];
  idType: 'number' | 'uuidString';
  deletionConfirmationQuestion?: string;
}
