import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { DocumentNode } from '@apollo/client';
import { BaseRow, BulkAction } from './types';

interface UseTableGridProps<V> {
  queryHook: any; // useRoleQuery or useAdminQuery
  query: DocumentNode;
  queryVariables?: V;
  pageSize?: number;
  debounceMs?: number; // Configurable debounce time in milliseconds
  refetchFilter?: (searchFilter: string) => Record<string, any>;
}

export function useTableGrid<V>({
  queryHook,
  query,
  queryVariables = {} as V,
  pageSize = 15,
  debounceMs = 300, // Default to 300ms
  refetchFilter,
}: UseTableGridProps<V>) {
  const [searchFilter, setSearchFilter] = useState('');
  const [pageIndex, setPageIndex] = useState(0);

  const queryResult = queryHook(query, {
    variables: {
      offset: pageIndex * pageSize,
      limit: pageSize,
      ...queryVariables,
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
    });
  }, [pageIndex, debouncedRefetch, searchFilter, queryVariables, pageSize, refetchFilter]);

  const handleSetSearchFilter = useCallback((value: string) => {
    setSearchFilter(value);
    setPageIndex(0);
  }, []);

  const handleSetPageIndex = useCallback((index: number) => {
    setPageIndex(index);
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
