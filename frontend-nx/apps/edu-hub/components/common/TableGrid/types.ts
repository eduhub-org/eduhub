import { ApolloError, DocumentNode } from '@apollo/client';
import { ColumnDef, SortingState } from '@tanstack/react-table';
import { ReactElement } from 'react';

import { AuthRoles } from '../../../types/enums';

export interface BaseRow {
  id: number;
}

export type TableGridSortMapping =
  | string
  | Record<string, any>
  | Array<string | Record<string, any>>
  | null;

export interface BulkAction {
  value: string;
  label: string;
  group?: string; // Optional group name for grouping menu items
  disabled?: boolean;
  disabledReason?: string;
  requiresSelection?: boolean;
}

export interface TableGridProps<T extends BaseRow> {
  addButtonText?: string;
  data: T[];
  columns: ColumnDef<T>[];
  deleteMutation?: DocumentNode;
  deleteIdType?: 'number' | 'uuidString';
  /** Overrides the Hasura role used for deleteMutation (defaults to the current session role). */
  role?: AuthRoles;
  generateDeletionConfirmationQuestion?: (row: T) => string;
  enablePagination?: boolean;
  error: ApolloError | null | undefined;
  expandableRowComponent?: (props: { row: T }) => ReactElement<any> | null;
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
  /** When true, wraps the table in a rounded card (e.g. course page sections) */
  rounded?: boolean;
  /** Navigate to full-page editor on chevron click (mutually exclusive with expandableRowComponent). */
  rowHref?: (row: T) => string;
  onRowNavigate?: (row: T) => void;
  /** When false, the row delete control is disabled (TableGrid delete column). */
  canDeleteRow?: (row: T) => boolean;
  /** GraphQL variable name for delete mutation (default: id). */
  deleteVariableName?: string;
  /** Return an error message when delete response indicates failure (e.g. Hasura actions). */
  validateDeleteResult?: (data: unknown) => string | null;
}

export interface UseTableGridProps<V> {
  queryHook: any; // useRoleQuery or useAdminQuery
  query: DocumentNode;
  queryVariables?: V;
  pageSize?: number;
  debounceMs?: number; // Configurable debounce time in milliseconds
  refetchFilter?: (searchFilter: string) => Record<string, any>;
  sortColumnMapper?: (columnId: string) => TableGridSortMapping;
  defaultSort?: Record<string, any>[]; // Default sort when no user sorting is applied
} 

export interface TableGridDeleteButtonProps {
  deleteMutation: DocumentNode;
  id: string | number;
  refetchQueries: string[];
  idType: 'number' | 'uuidString';
  deletionConfirmationQuestion?: string;
  /** Overrides the Hasura role used for the delete mutation (defaults to the current session role). */
  role?: AuthRoles;
  deleteVariableName?: string;
  disabled?: boolean;
  validateDeleteResult?: (data: unknown) => string | null;
}
