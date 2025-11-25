import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { SortingState } from '@tanstack/react-table';
import { BaseRow, BulkAction, UseTableGridProps } from './types';

/**
 * Converts TanStack Table SortingState to Hasura order_by format
 * @param sorting - TanStack Table sorting state (e.g., [{ id: 'name', desc: false }])
 * @param sortColumnMapper - Optional function to map column IDs to GraphQL field names or nested structures
 * @returns Hasura order_by format (e.g., [{ name: 'asc' }] or [{ Users_aggregate: { aggregate: { count: 'asc' } } }]) or empty array to clear sorting
 */
function convertSortingToOrderBy(
  sorting: SortingState,
  sortColumnMapper?: (columnId: string) => string | Record<string, any> | null
): Record<string, any>[] {
  if (!sorting || sorting.length === 0) {
    return [];
  }

  const direction = (desc: boolean) => (desc ? 'desc' : 'asc');

  const orderBy = sorting
    .map((sort) => {
      const columnId = sort.id;
      const mappedField = sortColumnMapper ? sortColumnMapper(columnId) : columnId;
      
      // Skip if mapper returns null (unsupported column for server-side sorting)
      if (!mappedField) {
        return null;
      }

      // Handle string (simple field name)
      if (typeof mappedField === 'string') {
        return {
          [mappedField]: direction(sort.desc),
        };
      }

      // Handle object (nested structure)
      if (typeof mappedField === 'object' && mappedField !== null) {
        return mergeSortDirection(mappedField, direction(sort.desc));
      }

      return null;
    })
    .filter((orderBy): orderBy is Record<string, any> => orderBy !== null);

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
  defaultSort = [{ updated_at: 'desc' }], // Default to updated_at desc if not specified
}: UseTableGridProps<V>) {
  const [searchFilter, setSearchFilter] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [sorting, setSorting] = useState<SortingState>([]);

  // Convert sorting state to Hasura order_by format
  // Use defaultSort when no user sorting is applied
  const orderBy = useMemo(() => {
    const userSort = convertSortingToOrderBy(sorting, sortColumnMapper);
    // If user has applied sorting, use it; otherwise use defaultSort
    return userSort.length > 0 ? userSort : (defaultSort || []);
  }, [sorting, sortColumnMapper, defaultSort]);

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
