import { useState, useCallback, useMemo } from 'react';

import { BaseRow, BulkAction } from '../components/common/TableGrid';

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
