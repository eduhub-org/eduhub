import { BaseRow, TableGridFilter, TableGridProps } from './types';
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { TextField, Checkbox, Select, MenuItem, FormControl, InputLabel, SelectChangeEvent, ListSubheader, ListItemText, Divider, Tooltip, CircularProgress } from '@mui/material';
import { useTranslations } from 'next-intl';
import { ArrowDropUp, ArrowDropDown } from '@mui/icons-material';
import { useRouter } from 'next/router';
import { MdArrowBack, MdArrowForward, MdChevronRight } from 'react-icons/md';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import {
  CellContext,
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
import { useMediaQuery } from '../../../hooks/useMediaQuery';

/** Checkboxes follow the text colour of their surface instead of a brand accent. */
const neutralCheckboxSx = {
  color: 'var(--eduhub-label-primary)',
  '&.Mui-checked, &.MuiCheckbox-indeterminate': {
    color: 'var(--eduhub-label-primary)',
  },
};

/** Outlined select on the dark page surface (bulk action, mobile sort). */
const darkSelectSx = {
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
};

const darkSelectMenuProps = {
  PaperProps: {
    sx: {
      backgroundColor: 'var(--eduhub-bg-card)',
      color: 'var(--eduhub-label-primary)',
    },
  },
};

/**
 * Renders a cell with a component type that never changes. flexRender mounts a cell function as its
 * own component, so every new column definition (callers often rebuild columns from refetched data)
 * remounted all cells: inputs lost focus mid-typing and their "saved" feedback vanished. Calling the
 * cell function here keeps the same hooks per column while the DOM and state survive.
 */
const StableCell: React.FC<{ context: CellContext<any, unknown> }> = ({ context }) => {
  const render = context.column.columnDef.cell;
  return <>{typeof render === 'function' ? render(context) : render}</>;
};

/** Stable wrapper so expandable row content is not remounted when parent re-renders (e.g. after refetch). */
const ExpandableRowWrapper: React.FC<{
  renderFn: (props: { row: any }) => React.ReactElement<any> | null;
  row: any;
}> = ({ renderFn, row }) => renderFn({ row });

/**
 * Toolbar facet filter: one dropdown per filter with a checkbox per option, so several values can
 * be picked at once and the toolbar stays compact as options are added. Matches the styling of the
 * bulk-action select next to it.
 */
const TableGridFilterSelect: React.FC<{ filter: TableGridFilter }> = ({ filter }) => {
  const labelId = `table-grid-filter-${filter.id}-label`;
  const optionLabel = (value: string) => filter.options.find((option) => option.value === value)?.label ?? value;

  return (
    <FormControl variant="outlined" size="small" sx={{ minWidth: 200, maxWidth: 320 }}>
      <InputLabel id={labelId} sx={{ color: 'var(--eduhub-label-primary)' }}>
        {filter.label}
      </InputLabel>
      <Select
        multiple
        labelId={labelId}
        value={filter.selected}
        label={filter.label}
        onChange={(event: SelectChangeEvent<string[]>) => {
          const { value } = event.target;
          filter.onChange(typeof value === 'string' ? value.split(',') : value);
        }}
        renderValue={(selected) => selected.map(optionLabel).join(', ')}
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
        {filter.options.map((option) => (
          <MenuItem key={option.value} value={option.value} sx={{ color: 'var(--eduhub-label-primary)' }}>
            <Checkbox
              size="small"
              checked={filter.selected.includes(option.value)}
              sx={{
                padding: '0 8px 0 0',
                color: 'var(--eduhub-label-primary)',
                '&.Mui-checked': {
                  color: 'var(--eduhub-label-primary)',
                },
              }}
            />
            <ListItemText primary={option.label} primaryTypographyProps={{ fontSize: '0.875rem' }} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

const TableGrid = <T extends BaseRow,>({
  addButtonText,
  addButtonDisabledHint,
  data,
  columns,
  deleteMutation,
  deleteIdType,
  role,
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
  renderMobileRow,
  preserveRowsWhileLoading = false,
  rowHref,
  onRowNavigate,
  canDeleteRow,
  showDeleteForRow,
  canExpandRow,
  rowClassName,
  deleteVariableName = 'id',
  validateDeleteResult,
  onRowDelete,
  filters = [],
}: TableGridProps<T>) => {
  const router = useRouter();
  const navigateMode = Boolean(rowHref || onRowNavigate);
  // The delete column is rendered for either flavor: a single delete mutation, or a caller-owned
  // deletion (onRowDelete) for rows that take more than one mutation to remove.
  const showDeleteColumn = Boolean(deleteMutation || onRowDelete);
  if (navigateMode && expandableRowComponent) {
    console.warn('TableGrid: rowHref/onRowNavigate is ignored when expandableRowComponent is set');
  }
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
  const settledPageRef = useRef<{
    data: T[];
    pageIndex: number;
    pageSize: number;
    totalCount: number | undefined;
  } | null>(null);

  useEffect(() => {
    if (!loading && !error) {
      settledPageRef.current = { data, pageIndex, pageSize, totalCount };
    }
  }, [data, error, loading, pageIndex, pageSize, totalCount]);

  const retainedPage =
    preserveRowsWhileLoading && loading ? settledPageRef.current : null;
  const tableData = retainedPage?.data ?? data;
  const tablePageIndex = retainedPage?.pageIndex ?? pageIndex;
  const tablePageSize = retainedPage?.pageSize ?? pageSize;
  const tableTotalCount = retainedPage?.totalCount ?? totalCount;
  const isShowingRetainedPage = retainedPage !== null;
  
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
    isBulkActionPending,
    setBulkAction,
    toggleRowSelection,
    toggleAllRows,
    handleBulkActionChange,
    clearSelections,
    isAllSelected,
    isSomeSelected,
  } = useBulkActions<T>(bulkActions, onBulkAction ?? (() => undefined));

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
    // A running action owns the selection until it finishes, so it is not interrupted.
    if (isBulkActionPending) {
      return;
    }
    const selectedAction = event.target.value;
    const actionConfig = bulkActions.find((action) => action.value === selectedAction);
    const isDisabled =
      !!actionConfig?.disabled ||
      (!!actionConfig?.requiresSelection && selectedRowIds.size === 0);
    if (isDisabled) {
      return;
    }
    setBulkAction(selectedAction);
    if (handleRowExpansionBulkAction(selectedAction)) {
      return;
    }
    void handleBulkActionChange(selectedAction, tableData);
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
                checked={isAllSelected(tableData)}
                indeterminate={isSomeSelected(tableData)}
                onChange={() => toggleAllRows(tableData)}
                sx={neutralCheckboxSx}
              />
            ),
            cell: ({ row }) => (
              <Checkbox
                checked={selectedRowIds.has(row.original.id)}
                onChange={() => toggleRowSelection(row.original.id)}
                sx={neutralCheckboxSx}
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
  }, [columns, showCheckbox, toggleRowSelection, selectedRowIds, toggleAllRows, tableData, isAllSelected, isSomeSelected]);


  // Columns can opt out below a breakpoint (meta.hideBelow). Hidden columns also leave the row
  // width calculation, so narrow screens do not scroll sideways for columns nobody sees.
  // max-width queries start out false during SSR, i.e. everything is shown until measured.
  const belowLg = useMediaQuery('(max-width: 1023px)');
  const belowXl = useMediaQuery('(max-width: 1279px)');
  const isPhone = useMediaQuery('(max-width: 767px)');
  const useMobileCards = Boolean(renderMobileRow) && isPhone;
  const columnVisibility = useMemo(() => {
    const visibility: Record<string, boolean> = {};
    columns.forEach((col) => {
      const hideBelow = col.meta?.hideBelow;
      const id = col.id ?? (col as { accessorKey?: string }).accessorKey;
      if (hideBelow && id) {
        visibility[id] = hideBelow === 'xl' ? !belowXl : !belowLg;
      }
    });
    return visibility;
  }, [columns, belowLg, belowXl]);

  const table = useReactTable({
    data: tableData,
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
      columnVisibility,
      globalFilter: searchFilter,
      ...(enablePagination && {
        pagination: { pageIndex: tablePageIndex, pageSize: tablePageSize },
      }),
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

  const totalPages = Math.ceil((tableTotalCount || 0) / tablePageSize);

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
    const expandButtonWidth = expandableRowComponent || navigateMode ? 40 : 0;
    const deleteButtonWidth = showDeleteColumn ? 80 : 0;
    
    return totalColumnWidth + totalGapWidth + leftPadding + expandButtonWidth + deleteButtonWidth;
  })();

  /** Data columns grow to fill available width; checkbox column stays fixed. */
  const getDataColumnStyle = (columnId: string, size: number): React.CSSProperties =>
    columnId === 'selection'
      ? { width: `${size}px`, flexShrink: 0 }
      : {
          flex: '1 1 0%',
          minWidth: `${size}px`,
          flexShrink: 0,
          overflow: 'hidden',
        };

  const showToolbar = Boolean(onAddButtonClick) || showCheckbox || showGlobalSearchField || filters.length > 0;
  const hasSelection = showCheckbox && selectedRowIds.size > 0;

  const toolbarClassName = 'flex flex-wrap justify-between items-center gap-3 mb-4';

  const toolbar = showToolbar ? (
      <div className={toolbarClassName}>
        <div className="flex flex-wrap items-center gap-3">
          {onAddButtonClick && (
            <div className="text-label-primary">
              <AddButton
                onClick={onAddButtonClick}
                title={addButtonText ?? ''}
                size="medium"
                disabled={Boolean(addButtonDisabledHint)}
              />
              {addButtonDisabledHint && (
                <p className="mt-1 text-sm text-label-secondary">{addButtonDisabledHint}</p>
              )}
            </div>
          )}
          {showCheckbox && (
            // While rows are selected, the count, the action and "clear" read as one selection bar.
            <div
              className={`flex flex-wrap items-center gap-3 ${
                hasSelection ? 'rounded-lg border border-border-primary bg-bg-card py-2 pl-3 pr-2' : ''
              }`}
            >
            {hasSelection && (
              <span className="text-sm font-semibold text-label-primary">
                {t('common.table_grid.selected_count', { count: selectedRowIds.size })}
              </span>
            )}
            <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="bulk-action-label" sx={{ color: 'var(--eduhub-label-primary)' }}>
                {t('common.table_grid.bulk_action')}
              </InputLabel>
              <Select
                labelId="bulk-action-label"
                value={bulkAction}
                onChange={handleSelectChange}
                disabled={isBulkActionPending}
                label={t('common.table_grid.bulk_action')}
                sx={darkSelectSx}
                MenuProps={darkSelectMenuProps}
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
                  const isActionDisabled =
                    !!action.disabled ||
                    (!!action.requiresSelection && selectedRowIds.size === 0);
                  const disabledReason = isActionDisabled ? action.disabledReason : undefined;
                  acc.push(
                    <MenuItem
                      key={action.value}
                      value={action.value}
                      disabled={isActionDisabled}
                      sx={{
                        pl: action.group ? 3 : 1,
                        color: isActionDisabled
                          ? 'var(--eduhub-label-secondary)'
                          : 'var(--eduhub-label-primary)',
                        '&.Mui-disabled': {
                          color: 'var(--eduhub-label-secondary)',
                          opacity: 0.7,
                          pointerEvents: 'auto',
                          cursor: 'not-allowed',
                        },
                      }}
                    >
                      <Tooltip
                        title={disabledReason ?? ''}
                        placement="right"
                        disableHoverListener={!isActionDisabled || !disabledReason}
                      >
                        <span>{action.label}</span>
                      </Tooltip>
                    </MenuItem>
                  );
                  return acc;
                }, [] as React.ReactNode[])}
              </Select>
            </FormControl>
            {hasSelection && (
              <button
                type="button"
                onClick={clearSelections}
                disabled={isBulkActionPending}
                className="text-sm underline text-label-secondary hover:text-label-primary disabled:opacity-50"
              >
                {t('common.table_grid.clear_selection')}
              </button>
            )}
            </div>
          )}
          {filters.map((filter) => (
            <TableGridFilterSelect key={filter.id} filter={filter} />
          ))}
        </div>
        {showGlobalSearchField && (
          <TextField
            value={searchFilter}
            onChange={(e) => onGlobalFilterChange(e.target.value)}
            label={t('common.search')}
            variant="outlined"
            size="small"
            sx={{
              // Full width once the toolbar wraps on phones.
              width: { xs: '100%', sm: '16rem' },
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
  ) : null;

  // Content width of a row, i.e. without the expand strip and the delete gutter.
  const rowContentMinWidth =
    mainRowContentWidth - (expandableRowComponent != null || navigateMode ? 40 : 0) - (showDeleteColumn ? 80 : 0);
  const hasRowEndStrip = Boolean(expandableRowComponent || navigateMode);

  // The table is a rounded frame: a header bar, white rows separated by divider lines, and a grey
  // strip closing each row. The delete bin sits outside the frame, next to its row.
  const tableHeaderRow = (
    <div className="flex items-stretch">
      <div className="flex-grow min-w-0 flex items-stretch rounded-t-xl overflow-hidden bg-bg-secondary text-label-secondary text-sm font-semibold">
        <div
          className={`flex-grow min-w-0 flex gap-3 ${!showCheckbox ? 'pl-3' : ''}`}
          style={{ minWidth: `${rowContentMinWidth}px`, width: '100%' }}
        >
          {table.getHeaderGroups().map((headerGroup) => (
            <React.Fragment key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const headerAlignCenter = header.column.columnDef.meta?.align === 'center';
                return (
                <div
                  key={header.id}
                  className={`${header.column.columnDef.meta?.className || ''} ${header.column.id === 'selection' ? '' : 'min-w-0'} relative flex items-center min-h-12 ${header.column.getCanSort() ? 'cursor-pointer' : ''}`}
                  style={getDataColumnStyle(header.column.id, header.getSize())}
                  onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                >
                  {header.column.columnDef.header === '' ? null : (
                    <div className={`flex items-center w-full ${headerAlignCenter ? 'justify-center' : ''}`}>
                      <span className={headerAlignCenter ? 'min-w-0 text-center' : 'flex-1 min-w-0'}>
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
                );
              })}
            </React.Fragment>
          ))}
        </div>
        {hasRowEndStrip && <div className="w-10 flex-shrink-0" />}
      </div>
      {showDeleteColumn && <div className="w-20 flex-shrink-0" />}
    </div>
  );

  const handleRowNavigate = useCallback(
    (row: T) => {
      if (onRowNavigate) {
        onRowNavigate(row);
        return;
      }
      const href = rowHref?.(row);
      if (href) {
        router.push(href);
      }
    },
    [onRowNavigate, rowHref, router]
  );

  // When server-side sorting is enabled, pagination is also server-side
  // Don't slice - data is already paginated by the server
  // When server-side sorting is NOT enabled but pagination is enabled,
  // we slice for client-side pagination (backward compatibility)
  const rowsToDisplay =
    enablePagination && !isServerSideSorting
      ? table.getRowModel().rows.slice(tablePageIndex * tablePageSize, (tablePageIndex + 1) * tablePageSize)
      : table.getRowModel().rows;
  const showBody = (!loading || isShowingRetainedPage) && !error;

  const renderDeleteButton = (row: T, label?: string) => (
    <TableGridDeleteButton
      deleteMutation={deleteMutation}
      onDelete={onRowDelete ? () => onRowDelete(row) : undefined}
      id={row.id}
      idType={deleteIdType ?? 'number'}
      role={role}
      deleteVariableName={deleteVariableName}
      disabled={canDeleteRow ? !canDeleteRow(row) : false}
      validateDeleteResult={validateDeleteResult}
      deletionConfirmationQuestion={
        generateDeletionConfirmationQuestion ? generateDeletionConfirmationQuestion(row) : undefined
      }
      refetchQueries={refetchQueries}
      label={label}
    />
  );

  const rowHasDelete = (row: T) => showDeleteColumn && (!showDeleteForRow || showDeleteForRow(row));

  const selectionCheckbox = (row: T) => (
    <Checkbox
      checked={selectedRowIds.has(row.id)}
      onChange={() => toggleRowSelection(row.id)}
      sx={neutralCheckboxSx}
    />
  );

  const tableBodyRows =
    showBody &&
    (() => {
      // If there are no rows, render an empty row
      if (rowsToDisplay.length === 0) {
        return (
          <div className="flex items-stretch">
            <div className={`flex-grow min-w-0 overflow-hidden rounded-b-xl bg-fill-primary text-label-primary light ${compactRows ? 'py-1' : 'py-2'}`}>
              <div
                className={`flex items-center gap-3 ${!showCheckbox ? 'pl-3' : ''}`}
                style={{ minWidth: `${rowContentMinWidth}px`, width: '100%' }}
              >
                {table.getHeaderGroups()[0]?.headers.map((header) => {
                  const emptyAlignCenter = header.column.columnDef.meta?.align === 'center';
                  return (
                  <div
                    key={header.id}
                    className={`flex items-center min-h-0 ${header.column.id === 'selection' ? '' : 'min-w-0'} ${emptyAlignCenter ? 'justify-center' : ''} ${header.column.columnDef.meta?.className || ''}`}
                    style={getDataColumnStyle(header.column.id, header.getSize())}
                  >
                    <span className="text-label-secondary">-</span>
                  </div>
                );})}
              </div>
            </div>
            {showDeleteColumn && <div className="w-20 flex-shrink-0"></div>}
          </div>
        );
      }

      // Otherwise, render the actual data rows
      return rowsToDisplay.map((row, rowIndex) => {
        const isLastRow = rowIndex === rowsToDisplay.length - 1;
        const isExpanded = expandedRows.has(row.original.id);
        const rowExpandable = canExpandRow ? canExpandRow(row.original) : true;
        const rowSurface = selectedRowIds.has(row.original.id) ? 'bg-bg-secondary' : 'bg-fill-primary';

        return (
        <React.Fragment key={row.id}>
          {/* Primary Row */}
          <div className="flex items-stretch">
            <div
              className={`flex-grow min-w-0 flex items-stretch overflow-hidden light text-label-primary ${rowSurface} ${
                rowIndex > 0 ? 'border-t border-table-divider' : ''
              } ${isLastRow && !isExpanded ? 'rounded-b-xl' : ''} ${rowClassName?.(row.original) ?? ''}`}
            >
              <div className={`flex-grow min-w-0 ${compactRows ? 'py-1' : 'py-2'}`}>
                <div
                  className={`flex items-center gap-3 ${!showCheckbox ? 'pl-3' : ''}`}
                  style={{ minWidth: `${rowContentMinWidth}px`, width: '100%' }}
                >
                  {row.getVisibleCells().map((cell) => {
                    const cellAlignCenter = cell.column.columnDef.meta?.align === 'center';
                    return (
                    <div
                      key={cell.id}
                      className={`flex items-center min-h-0 ${cell.column.id === 'selection' ? '' : 'min-w-0'} ${cellAlignCenter ? 'justify-center' : ''} ${cell.column.columnDef.meta?.className || ''}`}
                      style={getDataColumnStyle(cell.column.id, cell.column.getSize())}
                    >
                      <StableCell context={cell.getContext()} />
                    </div>
                  );})}
                </div>
              </div>
              {navigateMode && !expandableRowComponent && (
                <div className="w-10 flex-shrink-0 flex items-stretch bg-table-expand">
                  <button
                    type="button"
                    onClick={() => handleRowNavigate(row.original)}
                    className="w-full flex items-center justify-center text-label-primary hover:bg-table-expand-hover transition-colors duration-200"
                    aria-label={t('common.table_grid.open_row')}
                  >
                    <MdChevronRight size={22} />
                  </button>
                </div>
              )}
              {expandableRowComponent && !rowExpandable && <div className="w-10 flex-shrink-0" />}
              {expandableRowComponent && rowExpandable && (
                <div className="w-10 flex-shrink-0 flex items-stretch bg-table-expand">
                  <button
                    type="button"
                    onClick={() => toggleRowExpansion(row.original.id)}
                    aria-expanded={isExpanded}
                    aria-label={t(isExpanded ? 'common.table_grid.collapse_row' : 'common.table_grid.expand_row')}
                    className="w-full flex items-center justify-center text-label-primary hover:bg-table-expand-hover transition-colors duration-200"
                  >
                    {isExpanded ? <IoIosArrowUp size={20} /> : <IoIosArrowDown size={20} />}
                  </button>
                </div>
              )}
            </div>
            {showDeleteColumn && (
              <div className="w-20 flex-shrink-0 flex items-center justify-center">
                {rowHasDelete(row.original) && renderDeleteButton(row.original)}
              </div>
            )}
          </div>
          {/* Expandable Row */}
          {expandableRowComponent && rowExpandable && isExpanded && (
            <div className="flex items-stretch">
              <div
                className={`flex-grow min-w-0 overflow-x-auto light bg-fill-primary text-label-primary border-t border-table-divider ${
                  isLastRow ? 'rounded-b-xl' : ''
                }`}
              >
                <div
                  className="flex items-stretch"
                  style={{ minWidth: `${mainRowContentWidth - (showDeleteColumn ? 80 : 0)}px`, width: '100%' }}
                >
                  <ExpandableRowWrapper
                    key={`expandableRow-${row.id}`}
                    renderFn={expandableRowComponent}
                    row={row.original}
                  />
                </div>
              </div>
              {showDeleteColumn && <div className="w-20 flex-shrink-0"></div>}
            </div>
          )}
        </React.Fragment>
      );
      });
    })();

  // Cards have no header row, so phones get its two jobs as explicit controls: select all, and sort.
  const sortableColumns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanSort() && typeof column.columnDef.header === 'string');
  const currentSortValue = sorting[0] ? `${sorting[0].id}:${sorting[0].desc ? 'desc' : 'asc'}` : '';
  const handleMobileSortChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    const separator = value.lastIndexOf(':');
    handleSortingChange(
      separator < 0 ? [] : [{ id: value.slice(0, separator), desc: value.slice(separator + 1) === 'desc' }]
    );
  };
  const mobileListControls =
    showBody && rowsToDisplay.length > 0 && (showCheckbox || sortableColumns.length > 0) ? (
      <div className="flex items-center justify-between gap-3 mb-2">
        {showCheckbox ? (
          <label className="flex items-center text-sm text-label-primary -ml-2 cursor-pointer">
            <Checkbox
              checked={isAllSelected(tableData)}
              indeterminate={isSomeSelected(tableData)}
              onChange={() => toggleAllRows(tableData)}
              sx={neutralCheckboxSx}
            />
            {t('common.table_grid.select_all')}
          </label>
        ) : (
          <span />
        )}
        {sortableColumns.length > 0 && (
          <FormControl size="small" sx={{ minWidth: 0, maxWidth: '65%' }}>
            <Select
              value={currentSortValue}
              displayEmpty
              onChange={handleMobileSortChange}
              inputProps={{ 'aria-label': t('common.table_grid.sort_by') }}
              sx={darkSelectSx}
              MenuProps={darkSelectMenuProps}
            >
              <MenuItem value="">{t('common.table_grid.sort_default')}</MenuItem>
              {sortableColumns.flatMap((column) => {
                const columnLabel = column.columnDef.header as string;
                return [
                  <MenuItem key={`${column.id}:asc`} value={`${column.id}:asc`}>
                    {t('common.table_grid.sort_asc', { column: columnLabel })}
                  </MenuItem>,
                  <MenuItem key={`${column.id}:desc`} value={`${column.id}:desc`}>
                    {t('common.table_grid.sort_desc', { column: columnLabel })}
                  </MenuItem>,
                ];
              })}
            </Select>
          </FormControl>
        )}
      </div>
    ) : null;

  // Phones: tables that provide a card summary render one card per row instead of the grid.
  const mobileCards =
    showBody &&
    (rowsToDisplay.length === 0 ? (
      <div className="rounded-xl light bg-fill-primary text-label-secondary p-4 text-center">-</div>
    ) : (
      <div className="flex flex-col gap-2">
        {rowsToDisplay.map((row) => {
          const isExpanded = expandedRows.has(row.original.id);
          const rowExpandable = Boolean(expandableRowComponent) && (canExpandRow ? canExpandRow(row.original) : true);
          return (
            <div
              key={row.id}
              className={`rounded-xl overflow-hidden light text-label-primary ${
                selectedRowIds.has(row.original.id) ? 'bg-bg-secondary' : 'bg-fill-primary'
              } ${rowClassName?.(row.original) ?? ''}`}
            >
              <div className="flex items-start gap-2 p-3">
                {showCheckbox && <div className="-ml-2 -mt-2">{selectionCheckbox(row.original)}</div>}
                <div className="flex-1 min-w-0">{renderMobileRow?.(row.original)}</div>
                {rowExpandable && (
                  <button
                    type="button"
                    onClick={() => toggleRowExpansion(row.original.id)}
                    aria-expanded={isExpanded}
                    aria-label={t(isExpanded ? 'common.table_grid.collapse_row' : 'common.table_grid.expand_row')}
                    className="w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center bg-table-expand hover:bg-table-expand-hover text-label-primary"
                  >
                    {isExpanded ? <IoIosArrowUp size={20} /> : <IoIosArrowDown size={20} />}
                  </button>
                )}
                {navigateMode && !expandableRowComponent && (
                  <button
                    type="button"
                    onClick={() => handleRowNavigate(row.original)}
                    aria-label={t('common.table_grid.open_row')}
                    className="w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center bg-table-expand hover:bg-table-expand-hover text-label-primary"
                  >
                    <MdChevronRight size={22} />
                  </button>
                )}
                {!rowExpandable && rowHasDelete(row.original) && renderDeleteButton(row.original)}
              </div>
              {rowExpandable && isExpanded && (
                <div className="border-t border-table-divider">
                  <ExpandableRowWrapper renderFn={expandableRowComponent!} row={row.original} />
                  {rowHasDelete(row.original) && (
                    <div className="border-t border-table-divider flex justify-center">
                      {renderDeleteButton(row.original, t('common.table_grid_delete_button.delete'))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    ));

  return (
    <div className="min-w-0 max-w-full">
      {/* The toolbar stays interactive while rows reload, so typing in the search field goes on. */}
      {toolbar}
      <div className="relative" aria-busy={loading}>
        <div
          className={isShowingRetainedPage ? 'pointer-events-none opacity-60' : ''}
          inert={isShowingRetainedPage || undefined}
        >
          {useMobileCards ? (
            <>
              {mobileListControls}
              {mobileCards}
            </>
          ) : (
          <div className="overflow-x-auto max-w-full">
            <div className="w-full" style={{ minWidth: `${mainRowContentWidth}px` }}>
              {tableHeaderRow}
              {tableBodyRows}
            </div>
          </div>
          )}

          {/* Pagination */}
          {(!loading || isShowingRetainedPage) &&
            !error &&
            enablePagination &&
            (tableTotalCount ?? 0) > 0 && (
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
                        value={tablePageSize}
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
                  {tablePageIndex > 0 && (
                    <MdArrowBack
                      className="border-2 rounded-full cursor-pointer hover:bg-indigo-100"
                      size={30}
                      onClick={handlePrevious}
                    />
                  )}
                  <p className="font-medium">
                    {t('common.table_grid.pagination_text', {
                      currentPage: tablePageIndex + 1,
                      totalPage: totalPages,
                    })}
                  </p>
                  {tablePageIndex < totalPages - 1 && (
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
        {isShowingRetainedPage && (
          <div className="absolute inset-0 flex justify-center pt-16">
            <CircularProgress size={28} />
          </div>
        )}
      </div>
    </div>
  );
};

export default TableGrid;
