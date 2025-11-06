import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { DocumentNode } from '@apollo/client';
import { SortingState } from '@tanstack/react-table';
import { BaseRow, BulkAction } from './types';

interface UseTableGridProps<V> {
  queryHook: any; // useRoleQuery or useAdminQuery
  query: DocumentNode;
  queryVariables?: V;
  pageSize?: number;
  debounceMs?: number; // Configurable debounce time in milliseconds
  refetchFilter?: (searchFilter: string) => Record<string, any>;
  sortColumnMapper?: (columnId: string) => string | null; // Maps column accessorKey to GraphQL field name
}

/**
 * Converts TanStack Table SortingState to Hasura order_by format
 * @param sorting - TanStack Table sorting state (e.g., [{ id: 'name', desc: false }])
 * @param sortColumnMapper - Optional function to map column IDs to GraphQL field names
 * @returns Hasura order_by format (e.g., [{ name: 'asc' }]) or empty array to clear sorting
 */
function convertSortingToOrderBy(
  sorting: SortingState,
  sortColumnMapper?: (columnId: string) => string | null
): Record<string, string>[] {
  if (!sorting || sorting.length === 0) {
    return [];
  }

  const orderBy = sorting
    .map((sort) => {
      const columnId = sort.id;
      const graphqlFieldName = sortColumnMapper ? sortColumnMapper(columnId) : columnId;
      
      // Skip if mapper returns null (unsupported column for server-side sorting)
      if (!graphqlFieldName) {
        return null;
      }

      return {
        [graphqlFieldName]: sort.desc ? 'desc' : 'asc',
      };
    })
    .filter((orderBy): orderBy is Record<string, string> => orderBy !== null);

  // Always return an array (empty if no valid sort orders) to clear server-side sort state
  return orderBy;
}

export function useTableGrid<V>({
  queryHook,
  query,
  queryVariables = {} as V,
  pageSize = 15,
  debounceMs = 300, // Default to 300ms
  refetchFilter,
  sortColumnMapper,
}: UseTableGridProps<V>) {
  const [searchFilter, setSearchFilter] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [sorting, setSorting] = useState<SortingState>([]);

  // Convert sorting state to Hasura order_by format
  const orderBy = useMemo(() => {
    return convertSortingToOrderBy(sorting, sortColumnMapper);
  }, [sorting, sortColumnMapper]);

  const queryResult = queryHook(query, {
    variables: {
      offset: pageIndex * pageSize,
      limit: pageSize,
      ...queryVariables,
      order_by: orderBy,
    },
  });

  const { data, loading, error, refetch } = queryResult;

  const debouncedRefetch = useDebouncedCallback(refetch, debounceMs);

  useEffect(() => {
    const refetchVariables = refetchFilter ? refetchFilter(searchFilter) : {};
    debouncedRefetch({
      offset: pageIndex * pageSize,
      limit: pageSize,
      ...queryVariables,
      ...refetchVariables, // Merge refetchFilter result into queryVariables
      order_by: orderBy,
    });
  }, [pageIndex, debouncedRefetch, searchFilter, queryVariables, pageSize, refetchFilter, orderBy]);

  const handleSetSearchFilter = useCallback((value: string) => {
    setSearchFilter(value);
    setPageIndex(0);
  }, []);

  const handleSetPageIndex = useCallback((index: number) => {
    setPageIndex(index);
  }, []);

  const handleSetSorting = useCallback((updater: SortingState | ((prev: SortingState) => SortingState)) => {
    setSorting(updater);
    setPageIndex(0); // Reset to first page when sorting changes
  }, []);

  return {
    data,
    loading,
    error,
    refetch: debouncedRefetch,
    searchFilter,
    pageIndex,
    setSearchFilter: handleSetSearchFilter,
    setPageIndex: handleSetPageIndex,
    sorting,
    setSorting: handleSetSorting,
  };
}

export const useBulkActions = <T extends BaseRow>(
  bulkActions: BulkAction[],
  onBulkAction: (action: string, selectedRows: T[]) => void
) => {
  const [selectedRowIds, setSelectedRowIds] = useState<Set<number>>(new Set());
  const [bulkAction, setBulkAction] = useState<string>('');

  const toggleRowSelection = useCallback((rowId: number) => {
    setSelectedRowIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  }, []);

  const toggleAllRows = useCallback((data: T[]) => {
    setSelectedRowIds(prev => {
      if (prev.size === data.length) {
        return new Set();
      } else {
        return new Set(data.map(row => row.id));
      }
    });
  }, []);

  const handleBulkActionChange = useCallback((action: string, data: T[]) => {
    if (onBulkAction && action) {
      const selectedRowsData = data.filter((row) => selectedRowIds.has(row.id));
      onBulkAction(action, selectedRowsData);
      setSelectedRowIds(new Set());
      setBulkAction('');
    }
  }, [onBulkAction, selectedRowIds]);

  const isAllSelected = useMemo(() => (data: T[]) => {
    return data.length > 0 && selectedRowIds.size === data.length;
  }, [selectedRowIds]);

  const isSomeSelected = useMemo(() => (data: T[]) => {
    return selectedRowIds.size > 0 && selectedRowIds.size < data.length;
  }, [selectedRowIds]);

  return {
    selectedRowIds,
    bulkAction,
    setBulkAction,
    toggleRowSelection,
    toggleAllRows,
    handleBulkActionChange,
    isAllSelected,
    isSomeSelected,
  };
};
