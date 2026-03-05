import { BaseRow, TableGridProps } from './types';
import React, { useState, useMemo, useCallback } from 'react';
import { TextField, Checkbox, Select, MenuItem, FormControl, InputLabel, SelectChangeEvent, ListSubheader, Divider } from '@mui/material';
import { useTranslations } from 'next-intl';
import { ArrowDropUp, ArrowDropDown } from '@mui/icons-material';
import { MdArrowBack, MdArrowForward } from 'react-icons/md';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  FilterFn,
} from '@tanstack/react-table';
import { rankItem } from '@tanstack/match-sorter-utils';

import AddButton from '../AddButton';
import { useBulkActions } from './hooks';
import TableGridDeleteButton from './components/TableGridDeleteButton';

/** Stable wrapper so expandable row content is not remounted when parent re-renders (e.g. after refetch). */
const ExpandableRowWrapper: React.FC<{
  renderFn: (props: { row: any }) => React.ReactElement | null;
  row: any;
}> = ({ renderFn, row }) => renderFn({ row });

const TableGrid = <T extends BaseRow,>({
  addButtonText,
  data,
  columns,
  deleteMutation,
  deleteIdType,
  generateDeletionConfirmationQuestion,
  error,
  expandableRowComponent,
  loading,
  enablePagination = true,
  pageSize = 15,
  pageIndex,
  onPageChange,
  refetchQueries,
  showGlobalSearchField = true,
  totalCount,
  searchFilter,
  onSearchFilterChange,
  onAddButtonClick,
  onBulkAction,
  bulkActions = [],
  onPageSizeChange,
  availablePageSizes = [10, 20, 50, 100, 500],
  sorting: externalSorting,
  onSortingChange: externalOnSortingChange,
  compactRows = false,
}: TableGridProps<T>) => {
  const onGlobalFilterChange = useCallback(
    (value: string) => {
      onSearchFilterChange(value);
    },
    [onSearchFilterChange]
  );
  if (enablePagination && typeof totalCount === 'undefined') {
    console.warn('TableGrid: totalCount prop is required when enablePagination is true');
  }

  if (enablePagination && typeof pageIndex === 'undefined') {
    console.warn('TableGrid: pageIndex prop is required when enablePagination is true');
  }

  if (enablePagination && typeof onPageChange === 'undefined') {
    console.warn('TableGrid: onPageChange prop is required when enablePagination is true');
  }

  if (enablePagination && typeof onPageSizeChange === 'undefined') {
    console.warn('TableGrid: onPageSizeChange prop is required when enablePagination is true');
  }

  const t = useTranslations();
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  
  // Use external sorting if provided (server-side sorting), otherwise use internal (client-side sorting)
  const sorting = externalSorting !== undefined ? externalSorting : internalSorting;
  const isServerSideSorting = externalSorting !== undefined && externalOnSortingChange !== undefined;
  
  const handleSortingChange = useCallback(
    (updater: SortingState | ((prev: SortingState) => SortingState)) => {
      if (isServerSideSorting && externalOnSortingChange) {
        externalOnSortingChange(updater);
      } else {
        setInternalSorting(updater);
      }
    },
    [isServerSideSorting, externalOnSortingChange]
  );

  const showCheckbox = bulkActions.length > 0;

  const {
    selectedRowIds,
    bulkAction,
    setBulkAction,
    toggleRowSelection,
    toggleAllRows,
    handleBulkActionChange,
    clearSelections,
    isAllSelected,
    isSomeSelected,
  } = useBulkActions<T>(bulkActions, onBulkAction);

  const handleRowExpansionBulkAction = useCallback(
    (action: string) => {
      if (selectedRowIds.size === 0) {
        return false;
      }

      if (action === 'expand_selected_rows') {
        setExpandedRows((prev) => {
          const next = new Set(prev);
          selectedRowIds.forEach((id) => next.add(id));
          return next;
        });
        clearSelections();
        return true;
      }

      if (action === 'collapse_selected_rows') {
        setExpandedRows((prev) => {
          const next = new Set(prev);
          selectedRowIds.forEach((id) => next.delete(id));
          return next;
        });
        clearSelections();
        return true;
      }

      return false;
    },
    [selectedRowIds, clearSelections]
  );

  // Add this new function to handle the Select onChange event
  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const selectedAction = event.target.value;
    setBulkAction(selectedAction);
    if (handleRowExpansionBulkAction(selectedAction)) {
      return;
    }
    handleBulkActionChange(selectedAction, data);
  };

  const handlePrevious = () => {
    const newIndex = Math.max(0, pageIndex - 1);
    onPageChange?.(newIndex);
  };

  const handleNext = () => {
    const newIndex = pageIndex + 1;
    onPageChange?.(newIndex);
  };

  const toggleRowExpansion = useCallback(
    (rowId: number) => {
      const newExpandedRows = new Set(expandedRows);
      if (expandedRows.has(rowId)) {
        newExpandedRows.delete(rowId);
      } else {
        newExpandedRows.add(rowId);
      }
      setExpandedRows(newExpandedRows);
    },
    [expandedRows]
  );

  const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
    const itemRank = rankItem(row.getValue(columnId), value);
    addMeta({ itemRank });
    return itemRank.passed;
  };

  const memoizedColumns = useMemo(() => {
    const selectionColumn: ColumnDef<T>[] = showCheckbox
      ? [
          {
            id: 'selection',
            size: 50, // Fixed width for checkbox column
            header: () => (
              <Checkbox
                checked={isAllSelected(data)}
                indeterminate={isSomeSelected(data)}
                onChange={() => toggleAllRows(data)}
                sx={{
                  color: 'var(--eduhub-label-primary)',
                  '&.Mui-checked': {
                    color: 'var(--eduhub-brand)',
                  },
                  '&.MuiCheckbox-indeterminate': {
                    color: 'var(--eduhub-brand)',
                  },
                }}
              />
            ),
            cell: ({ row }) => (
              <Checkbox
                checked={selectedRowIds.has(row.original.id)}
                onChange={() => toggleRowSelection(row.original.id)}
                sx={{
                  color: 'var(--eduhub-label-primary)',
                  '&.Mui-checked': {
                    color: 'var(--eduhub-brand)',
                  },
                }}
              />
            ),
          },
        ]
      : [];

    const dataColumns = columns.map((col) => ({
      ...col,
      // Backward compatibility: convert meta.width to size if size is not specified
      size: col.size || (col.meta?.width ? col.meta.width * 100 : undefined),
    }));
    return [...selectionColumn, ...dataColumns];
  }, [columns, showCheckbox, toggleRowSelection, selectedRowIds, toggleAllRows, data, isAllSelected, isSomeSelected]);


  const table = useReactTable({
    data,
    defaultColumn: {
      enableSorting: false,
      size: 150, // Default column width
      minSize: 50, // Minimum column width
      maxSize: 800, // Maximum column width
    },
    columns: memoizedColumns,
    filterFns: { fuzzy: fuzzyFilter },
    manualPagination: enablePagination,
    manualFiltering: true,
    manualSorting: isServerSideSorting, // Enable manual sorting when server-side sorting is used
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    state: {
      sorting,
      globalFilter: searchFilter,
      ...(enablePagination && { pagination: { pageIndex, pageSize } }),
    },
    globalFilterFn: fuzzyFilter,
    onGlobalFilterChange: onGlobalFilterChange,
    onSortingChange: handleSortingChange,
    getCoreRowModel: getCoreRowModel(),
    ...(!isServerSideSorting && { getSortedRowModel: getSortedRowModel() }), // Only use client-side sorting when not using server-side sorting
    debugTable: false, // Set to true only for debugging table issues
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    enableMultiRowSelection: true,
  });

  const totalPages = Math.ceil((totalCount || 0) / pageSize);

  // Calculate total width of main row content for proper alignment and scrolling
  // Use cell column sizes (from data rows) to avoid sort arrow width issues in headers
  // Calculate directly (not memoized) to ensure it updates when columns are resized
  const headerGroups = table.getHeaderGroups();
  const rows = table.getRowModel().rows;
  
  const mainRowContentWidth = (() => {
    if (headerGroups.length === 0) return 0;
    
    // Use cell column sizes from first row if available (avoids sort arrow width in headers)
    // Otherwise fall back to header sizes
    let totalColumnWidth = 0;
    if (rows.length > 0) {
      totalColumnWidth = rows[0].getVisibleCells().reduce((sum, cell) => {
        return sum + cell.column.getSize();
      }, 0);
    } else {
      totalColumnWidth = headerGroups[0].headers.reduce((sum, header) => {
        return sum + header.getSize();
      }, 0);
    }
    
    // Add gaps between columns (gap-3 = 12px)
    const gapSize = 12; // gap-3 in Tailwind
    const columnCount = rows.length > 0 ? rows[0].getVisibleCells().length : headerGroups[0].headers.length;
    const gapCount = Math.max(0, columnCount - 1);
    const totalGapWidth = gapCount * gapSize;
    
    // Add left padding if no checkbox (pl-3 = 12px)
    const leftPadding = showCheckbox ? 0 : 12;
    
    // Add action column widths (w-10 = 40px, w-20 = 80px)
    const expandButtonWidth = expandableRowComponent ? 40 : 0;
    const deleteButtonWidth = deleteMutation ? 80 : 0;
    
    return totalColumnWidth + totalGapWidth + leftPadding + expandButtonWidth + deleteButtonWidth;
  })();

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          {onAddButtonClick && (
            <div className="text-label-primary mr-4">
              <AddButton onClick={onAddButtonClick} title={addButtonText} size="medium" />
            </div>
          )}
          {showCheckbox && (
            <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="bulk-action-label" sx={{ color: 'var(--eduhub-label-primary)' }}>
                {t('common.table_grid.bulk_action')}
              </InputLabel>
              <Select
                labelId="bulk-action-label"
                value={bulkAction}
                onChange={handleSelectChange}
                label={t('common.table_grid.bulk_action')}
                sx={{
                  color: 'var(--eduhub-label-primary)',
                  backgroundColor: 'var(--eduhub-bg-card)',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'var(--eduhub-border-primary)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'var(--eduhub-border-secondary)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'var(--eduhub-brand)',
                  },
                  '& .MuiSvgIcon-root': {
                    color: 'var(--eduhub-label-primary)',
                  },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      backgroundColor: 'var(--eduhub-bg-card)',
                      color: 'var(--eduhub-label-primary)',
                    },
                  },
                }}
              >
                <MenuItem value="" sx={{ color: 'var(--eduhub-label-primary)' }}>
                  <em>{t('common.table_grid.none')}</em>
                </MenuItem>
                {bulkActions.reduce((acc, action, index) => {
                  // Add group header if this is the first item in a group
                  if (action.group && (index === 0 || bulkActions[index - 1]?.group !== action.group)) {
                    // Add divider before group (always add divider before groups, except for the first group)
                    if (index > 0) {
                      acc.push(<Divider key={`divider-before-${action.value}`} sx={{ borderColor: 'var(--eduhub-border-primary)' }} />);
                    }
                    acc.push(
                      <ListSubheader key={`group-${action.group}`} sx={{ color: 'var(--eduhub-label-secondary)', backgroundColor: 'var(--eduhub-bg-secondary)', fontWeight: 600, fontSize: '0.75rem', lineHeight: 1.5 }}>
                        {action.group}
                      </ListSubheader>
                    );
                  }
                  acc.push(
                    <MenuItem key={action.value} value={action.value} sx={{ pl: action.group ? 3 : 1, color: 'var(--eduhub-label-primary)' }}>
                      {action.label}
                    </MenuItem>
                  );
                  return acc;
                }, [] as React.ReactNode[])}
              </Select>
            </FormControl>
          )}
        </div>
        {showGlobalSearchField && (
          <TextField
            value={searchFilter}
            onChange={(e) => onGlobalFilterChange(e.target.value)}
            label={t('common.search')}
            variant="outlined"
            size="small"
            sx={{
              width: '16rem',
              backgroundColor: 'var(--eduhub-bg-card)',
              '& .MuiInputBase-input': {
                color: 'var(--eduhub-label-primary)',
                '&::placeholder': {
                  color: 'var(--eduhub-label-secondary)',
                  opacity: 1,
                },
              },
              '& .MuiInputLabel-root': {
                color: 'var(--eduhub-label-primary)',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'var(--eduhub-border-primary)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'var(--eduhub-border-secondary)',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'var(--eduhub-brand)',
              },
            }}
            InputProps={{
              sx: { color: 'var(--eduhub-label-primary)' },
            }}
            InputLabelProps={{
              sx: { color: 'var(--eduhub-label-primary)' },
            }}
          />
        )}
      </div>

      {/* Table Container with horizontal scroll */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: `${mainRowContentWidth}px` }}>
          {/* Header row */}
          <div className="flex items-center mb-1 bg-bg-primary text-label-primary py-2">
        <div className={`flex-grow flex gap-3 ${!showCheckbox ? 'pl-3' : ''}`} style={{ minWidth: `${mainRowContentWidth - (expandableRowComponent ? 40 : 0) - (deleteMutation ? 80 : 0)}px` }}>
          {table.getHeaderGroups().map((headerGroup) => (
            <React.Fragment key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <div
                  key={header.id}
                  className={`${header.column.columnDef.meta?.className || ''} relative flex items-center h-12 ${header.column.getCanSort() ? 'cursor-pointer' : ''}`}
                  style={{
                    width: `${header.getSize()}px`,
                    flexShrink: 0,
                  }}
                  onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                >
                  {header.column.columnDef.header === '' ? null : (
                    <div className="flex items-center w-full">
                      <span className="flex-1 min-w-0">
                        {header.column.id === 'selection'
                          ? flexRender(header.column.columnDef.header, header.getContext())
                          : typeof header.column.columnDef.header === 'string'
                            ? header.column.columnDef.header
                            : flexRender(header.column.columnDef.header, header.getContext())}
                      </span>
                      {header.column.getCanSort() && (
                        <div className="flex flex-col items-center ml-1 flex-shrink-0">
                          <ArrowDropUp style={{ opacity: header.column.getIsSorted() === 'asc' ? 1 : 0.5, marginBottom: '-8px' }} />
                          <ArrowDropDown style={{ opacity: header.column.getIsSorted() === 'desc' ? 1 : 0.5, marginTop: '-8px' }} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
        {deleteMutation && <div className="w-20 flex-shrink-0" />}
        {expandableRowComponent && <div className="w-10 flex-shrink-0" />}
      </div>

      {/* Data Rows */}
      {!loading &&
        !error &&
        (() => {
          // When server-side sorting is enabled, pagination is also server-side
          // Don't slice - data is already paginated by the server
          // When server-side sorting is NOT enabled but pagination is enabled,
          // we slice for client-side pagination (backward compatibility)
          const rowsToDisplay = enablePagination && !isServerSideSorting
            ? table.getRowModel().rows.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)
            : table.getRowModel().rows;

          // If there are no rows, render an empty row
          if (rowsToDisplay.length === 0) {
            return (
              <div className="flex items-stretch mb-1">
                <div className={`flex-grow bg-bg-secondary text-label-primary light ${compactRows ? 'py-1' : 'py-2'}`}>
                  <div className={`flex items-center gap-3 ${!showCheckbox ? 'pl-3' : ''}`} style={{ minWidth: `${mainRowContentWidth - (expandableRowComponent ? 40 : 0) - (deleteMutation ? 80 : 0)}px` }}>
                    {table.getHeaderGroups()[0]?.headers.map((header) => (
                      <div
                        key={header.id}
                        className={`flex items-center min-h-0 ${header.column.columnDef.meta?.className || ''}`}
                        style={{
                          width: `${header.getSize()}px`,
                          flexShrink: 0,
                        }}
                      >
                        <span className="text-label-secondary">-</span>
                      </div>
                    ))}
                  </div>
                </div>
                {expandableRowComponent && <div className="w-10 flex-shrink-0 bg-gray-300"></div>}
                {deleteMutation && <div className="w-20 flex-shrink-0"></div>}
              </div>
            );
          }

          // Otherwise, render the actual data rows
          return rowsToDisplay.map((row) => (
            <React.Fragment key={row.id}>
              {/* Primary Row */}
              <div className={`flex items-stretch ${expandedRows.has(row.original.id) ? 'mb-0' : 'mb-1'}`}>
                <div className={`flex-grow bg-bg-secondary text-label-primary light ${compactRows ? 'py-1' : 'py-2'}`}>
                  <div className={`flex items-center gap-3 ${!showCheckbox ? 'pl-3' : ''}`} style={{ minWidth: `${mainRowContentWidth - (expandableRowComponent ? 40 : 0) - (deleteMutation ? 80 : 0)}px` }}>
                    {row.getVisibleCells().map((cell) => (
                      <div
                        key={cell.id}
                        className={`flex items-center min-h-0 ${cell.column.columnDef.meta?.className || ''}`}
                        style={{
                          width: `${cell.column.getSize()}px`,
                          flexShrink: 0,
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Add expand/collapse button here */}
                {expandableRowComponent && (
                  <div className="w-10 flex-shrink-0 flex items-stretch bg-gray-300">
                    <button
                      onClick={() => toggleRowExpansion(row.original.id)}
                      className="w-full flex items-center justify-center hover:bg-gray-400 transition-colors duration-200"
                    >
                      {expandedRows.has(row.original.id) ? <IoIosArrowUp size={20} /> : <IoIosArrowDown size={20} />}
                    </button>
                  </div>
                )}
                {deleteMutation && (
                  <div className="w-20 flex-shrink-0 flex items-center justify-center">
                    <TableGridDeleteButton
                      deleteMutation={deleteMutation}
                      id={row.original.id}
                      idType={deleteIdType}
                      deletionConfirmationQuestion={
                        generateDeletionConfirmationQuestion
                          ? generateDeletionConfirmationQuestion(row.original)
                          : undefined
                      }
                      refetchQueries={refetchQueries}
                    />
                  </div>
                )}
              </div>
              {/* Expandable Row */}
              {expandableRowComponent && expandedRows.has(row.original.id) && (
                <div className="flex items-stretch mb-1">
                  <div className="flex-grow bg-bg-secondary text-label-primary py-2 overflow-x-auto light">
                    <div className={`flex items-center gap-3 ${!showCheckbox ? 'pl-3' : ''}`} style={{ minWidth: `${mainRowContentWidth - (expandableRowComponent ? 40 : 0) - (deleteMutation ? 80 : 0)}px` }}>
                      <ExpandableRowWrapper
                        key={`expandableRow-${row.id}`}
                        renderFn={expandableRowComponent}
                        row={row.original}
                      />
                    </div>
                  </div>
                  {expandableRowComponent && <div className="w-10 flex-shrink-0"></div>}
                  {deleteMutation && <div className="w-20 flex-shrink-0"></div>}
                </div>
              )}
            </React.Fragment>
          ));
        })()}
        </div>
      </div>

      {/* Pagination */}
      {!loading && !error && enablePagination && totalCount > 0 && (
        <div className="flex justify-end pb-10 text-label-primary mt-4">
          <div className="flex flex-row items-center space-x-5">
            {onPageSizeChange && (
              <FormControl sx={{ m: 1, minWidth: 130 }} size="small">
                <InputLabel id="page-size-select-label" sx={{ color: 'white' }}>
                  {t('common.table_grid.items_per_page')}
                </InputLabel>
                <Select
                  labelId="page-size-select-label"
                  id="page-size-select"
                  value={pageSize}
                  label={t('common.table_grid.items_per_page')}
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
                  sx={{
                    color: 'white',
                    '.MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.23)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'white',
                    },
                    '.MuiSvgIcon-root': {
                      color: 'white',
                    },
                  }}
                >
                  {availablePageSizes.map((size) => (
                    <MenuItem key={size} value={size}>
                      {size}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            {pageIndex > 0 && (
              <MdArrowBack
                className="border-2 rounded-full cursor-pointer hover:bg-indigo-100"
                size={30}
                onClick={handlePrevious}
              />
            )}
            <p className="font-medium">
              {t('common.table_grid.pagination_text', { currentPage: pageIndex + 1, totalPage: totalPages })}
            </p>
            {pageIndex < totalPages - 1 && (
              <MdArrowForward
                className="border-2 rounded-full cursor-pointer hover:bg-indigo-100"
                size={30}
                onClick={handleNext}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TableGrid;
