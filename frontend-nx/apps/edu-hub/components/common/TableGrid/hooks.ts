import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useDebounce } from 'use-debounce';
import { SortingState } from '@tanstack/react-table';
import { BaseRow, BulkAction, TableGridSortMapping, UseTableGridProps } from './types';
import { mergeSortDirection } from './utils';

const DEFAULT_SORT: Record<string, any>[] = [{ updated_at: 'desc' }];

/**
 * Returns a referentially stable version of a JSON-serializable value.
 * The returned reference only changes when the serialized form changes,
 * preventing infinite re-render loops from inline object/array literals.
 */
function useStableValue<T>(value: T): T {
  const serialized = JSON.stringify(value);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => JSON.parse(serialized) as T, [serialized]);
}

/**
 * Converts TanStack Table SortingState to Hasura order_by format
 * @param sorting - TanStack Table sorting state (e.g., [{ id: 'name', desc: false }])
 * @param sortColumnMapper - Optional function to map column IDs to GraphQL field names or nested structures
 * @returns Hasura order_by format (e.g., [{ name: 'asc' }] or [{ Users_aggregate: { aggregate: { count: 'asc' } } }]) or empty array to clear sorting
 */
function convertSortMappingToOrderBy(
  mappedField: TableGridSortMapping,
  sortDirection: string
): Record<string, any>[] {
  if (!mappedField) {
    return [];
  }

  const mappedFields = Array.isArray(mappedField) ? mappedField : [mappedField];

  return mappedFields.map((field) => {
    if (typeof field === 'string') {
      return {
        [field]: sortDirection,
      };
    }

    return mergeSortDirection(field, sortDirection);
  });
}

function convertSortingToOrderBy(
  sorting: SortingState,
  sortColumnMapper?: (columnId: string) => TableGridSortMapping
): Record<string, any>[] {
  if (!sorting || sorting.length === 0) {
    return [];
  }

  const direction = (desc: boolean) => (desc ? 'desc' : 'asc');

  const orderBy = sorting
    .flatMap((sort) => {
      const columnId = sort.id;
      const mappedField = sortColumnMapper ? sortColumnMapper(columnId) : columnId;
      return convertSortMappingToOrderBy(mappedField, direction(sort.desc));
    })
    .filter((orderBy): orderBy is Record<string, any> => orderBy !== null);

  return orderBy;
}

export function useTableGrid<V>({
  queryHook,
  query,
  queryVariables = {} as V,
  pageSize: initialPageSize = 15,
  debounceMs = 300,
  refetchFilter,
  sortColumnMapper,
  defaultSort = DEFAULT_SORT,
}: UseTableGridProps<V>) {
  const [searchFilter, setSearchFilter] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sorting, setSorting] = useState<SortingState>([]);

  // Sync internal pageSize when the caller's prop changes (many callers manage
  // pageSize as external state and pass it in; without this, only the initial
  // value would be used).
  useEffect(() => {
    setPageSize(initialPageSize);
  }, [initialPageSize]);

  // Stabilize object/array props that callers typically pass as inline literals.
  // Without this, a new object identity each render would retrigger the effect.
  const stableQueryVariables = useStableValue(queryVariables);
  const stableDefaultSort = useStableValue(defaultSort);

  // Keep function props in refs so their identity changes don't trigger effects.
  // The latest function is always available via .current when the effect fires.
  const refetchFilterRef = useRef(refetchFilter);
  refetchFilterRef.current = refetchFilter;
  const sortColumnMapperRef = useRef(sortColumnMapper);
  sortColumnMapperRef.current = sortColumnMapper;

  const orderBy = useMemo(() => {
    const userSort = convertSortingToOrderBy(sorting, sortColumnMapperRef.current);
    return userSort.length > 0 ? userSort : (stableDefaultSort || []);
  }, [sorting, stableDefaultSort]);

  const [debouncedSearchFilter] = useDebounce(searchFilter, debounceMs);

  const rawVariables = useMemo(() => {
    const refetchVariables = refetchFilterRef.current
      ? refetchFilterRef.current(debouncedSearchFilter)
      : {};
    return {
      offset: pageIndex * pageSize,
      limit: pageSize,
      ...stableQueryVariables,
      ...refetchVariables,
      order_by: orderBy,
    };
  }, [
    pageIndex,
    pageSize,
    stableQueryVariables,
    debouncedSearchFilter,
    orderBy,
    refetchFilter,
  ]);

  const effectiveVariables = useStableValue(rawVariables);

  const queryOptions = useMemo(
    () => ({
      variables: effectiveVariables,
    }),
    [effectiveVariables]
  );

  const queryResult = queryHook(query, queryOptions);

  const { loading, error, refetch } = queryResult;
  // A new search or page is a new set of variables, for which Apollo reports no data while it
  // loads. Keeping the previous rows lets pages keep the table - and its focused search field -
  // mounted; `initialLoading` is only true while nothing has been loaded yet.
  const data = queryResult.data ?? queryResult.previousData;
  const initialLoading = loading && !data;

  const handleSetSearchFilter = useCallback((value: string) => {
    setSearchFilter(value);
    setPageIndex(0);
  }, []);

  const handleSetPageIndex = useCallback((index: number) => {
    setPageIndex(index);
  }, []);

  const handleSetSorting = useCallback((updater: SortingState | ((prev: SortingState) => SortingState)) => {
    setSorting(updater);
    setPageIndex(0);
  }, []);

  /**
   * Runs the table's query once more for up to `limit` rows matching the current search, filters
   * and sort order, across all pages (e.g. for TableGrid's `loadAllRows`). It keeps the role of
   * the table query and bypasses the cache, so the visible page is left untouched.
   */
  const fetchAllRows = useCallback(
    async (limit: number) => {
      const result = await queryResult.client.query({
        query,
        variables: { ...effectiveVariables, offset: 0, limit },
        context: queryResult.observable?.options.context,
        fetchPolicy: 'no-cache',
      });
      return result.data;
    },
    [effectiveVariables, query, queryResult.client, queryResult.observable]
  );

  return {
    queryResult,
    data,
    loading,
    initialLoading,
    error,
    refetch,
    searchFilter,
    pageIndex,
    setSearchFilter: handleSetSearchFilter,
    setPageIndex: handleSetPageIndex,
    pageSize,
    setPageSize,
    sorting,
    setSorting: handleSetSorting,
    fetchAllRows,
  };
}

/**
 * Bridges bulk actions that only finish later — typically after a confirmation dialog — to the
 * promise `onBulkAction` returns. `start()` hands TableGrid a promise that stays pending while the
 * dialog is open, so the row selection stays marked until `succeed()` or `fail()` settles it.
 */
export const useDeferredBulkAction = () => {
  const pendingRef = useRef<{ resolve: () => void; reject: () => void } | null>(null);

  const start = useCallback(() => {
    // A new action supersedes an unfinished one; keeping that selection is the safe default.
    pendingRef.current?.reject();
    pendingRef.current = null;
    return new Promise<void>((resolve, reject) => {
      pendingRef.current = {
        resolve,
        reject: () => reject(new Error('Bulk action was not completed')),
      };
    });
  }, []);

  const succeed = useCallback(() => {
    pendingRef.current?.resolve();
    pendingRef.current = null;
  }, []);

  const fail = useCallback(() => {
    pendingRef.current?.reject();
    pendingRef.current = null;
  }, []);

  return { start, succeed, fail };
};

/**
 * Row selection for bulk actions. The selection holds the rows themselves, not just their ids, so
 * it survives page changes and searches: an action runs on every selected row, including rows
 * selected on another page.
 */
export const useBulkActions = <T extends BaseRow>(
  _bulkActions: BulkAction[],
  onBulkAction: (action: string, selectedRows: T[]) => void | boolean | Promise<void | boolean>
) => {
  const [selectedRows, setSelectedRows] = useState<Map<number, T>>(new Map());
  const selectedRowIds = useMemo(() => new Set(selectedRows.keys()), [selectedRows]);
  const [bulkAction, setBulkAction] = useState<string>('');
  // A second action started while the first is still running would settle the wrong deferred
  // action (see useDeferredBulkAction), so only one runs at a time. The ref guards against a
  // second call before the state update lands.
  const [isBulkActionPending, setIsBulkActionPending] = useState(false);
  const isBulkActionPendingRef = useRef(false);

  const toggleRowSelection = useCallback((row: T) => {
    setSelectedRows(prev => {
      const next = new Map(prev);
      if (next.has(row.id)) {
        next.delete(row.id);
      } else {
        next.set(row.id, row);
      }
      return next;
    });
  }, []);

  /** Selects the rows of the current page, or deselects them when all of them are selected already. */
  const toggleAllRows = useCallback((data: T[]) => {
    setSelectedRows(prev => {
      const next = new Map(prev);
      // Compare by row id, not count: a new page of the same size is not "all selected".
      if (data.length > 0 && data.every(row => prev.has(row.id))) {
        data.forEach(row => next.delete(row.id));
      } else {
        data.forEach(row => next.set(row.id, row));
      }
      return next;
    });
  }, []);

  /** Adds rows to the selection, e.g. every row matching the current search across all pages. */
  const selectRows = useCallback((rows: T[]) => {
    setSelectedRows(prev => {
      const next = new Map(prev);
      rows.forEach(row => next.set(row.id, row));
      return next;
    });
  }, []);

  /**
   * Runs the bulk action and only drops the row selection once it actually succeeded: a handler
   * that rejects (or resolves to `false`, e.g. because nothing was applicable) keeps the rows
   * marked so the user can correct the problem and retry without reselecting everything.
   *
   * `data` is the current page: its rows replace their selected copies, which may have been
   * loaded before the last refetch.
   */
  const handleBulkActionChange = useCallback(async (action: string, data: T[]) => {
    if (!onBulkAction || !action || isBulkActionPendingRef.current) {
      return;
    }

    const currentRows = new Map(data.map((row) => [row.id, row]));
    const selectedRowsData = Array.from(selectedRows.values(), (row) => currentRows.get(row.id) ?? row);

    isBulkActionPendingRef.current = true;
    setIsBulkActionPending(true);

    try {
      const result = await onBulkAction(action, selectedRowsData);
      if (result !== false) {
        // Only the rows this action ran on: a row selected while it was running was not part
        // of it and stays marked.
        setSelectedRows((current) => {
          const remaining = new Map(current);
          selectedRowsData.forEach((row) => remaining.delete(row.id));
          return remaining;
        });
      }
    } catch {
      // Keep the selection; the handler is responsible for reporting the error to the user.
    } finally {
      isBulkActionPendingRef.current = false;
      setIsBulkActionPending(false);
      // The dropdown is a menu, not a state, so it always returns to its placeholder.
      setBulkAction('');
    }
  }, [onBulkAction, selectedRows]);

  const clearSelections = useCallback(() => {
    setSelectedRows(new Map());
    setBulkAction('');
  }, []);

  /** Drops rows from the selection that no longer exist, e.g. after deleting one. */
  const deselectRow = useCallback((rowId: number) => {
    setSelectedRows(prev => {
      if (!prev.has(rowId)) return prev;
      const next = new Map(prev);
      next.delete(rowId);
      return next;
    });
  }, []);

  const isAllSelected = useMemo(() => (data: T[]) => {
    return data.length > 0 && data.every(row => selectedRowIds.has(row.id));
  }, [selectedRowIds]);

  const isSomeSelected = useMemo(() => (data: T[]) => {
    const selectedCount = data.filter(row => selectedRowIds.has(row.id)).length;
    return selectedCount > 0 && selectedCount < data.length;
  }, [selectedRowIds]);

  return {
    selectedRowIds,
    bulkAction,
    isBulkActionPending,
    setBulkAction,
    toggleRowSelection,
    toggleAllRows,
    selectRows,
    deselectRow,
    handleBulkActionChange,
    clearSelections,
    isAllSelected,
    isSomeSelected,
  };
};
