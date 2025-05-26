import { BaseRow, TableGridProps } from './types';
import React, { useState, useMemo, useCallback } from 'react';
import { TextField, Checkbox, Select, MenuItem, FormControl, InputLabel, SelectChangeEvent } from '@mui/material';
import useTranslation from 'next-translate/useTranslation';
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

const TableGrid = <T extends BaseRow>({
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

  const { t } = useTranslation();
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [sorting, setSorting] = useState<SortingState>([]);

  const showCheckbox = bulkActions.length > 0;

  const {
    selectedRowIds,
    bulkAction,
    setBulkAction,
    toggleRowSelection,
    toggleAllRows,
    handleBulkActionChange,
    isAllSelected,
    isSomeSelected,
  } = useBulkActions<T>(bulkActions, onBulkAction);

  // Add this new function to handle the Select onChange event
  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const selectedAction = event.target.value;
    setBulkAction(selectedAction);
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
  const ExpandableRowComponent = expandableRowComponent;

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
            header: () => (
              <Checkbox
                checked={isAllSelected(data)}
                indeterminate={isSomeSelected(data)}
                onChange={() => toggleAllRows(data)}
                sx={{
                  color: 'white',
                  '&.Mui-checked': {
                    color: 'white',
                  },
                  '&.MuiCheckbox-indeterminate': {
                    color: 'white',
                  },
                }}
              />
            ),
            cell: ({ row }) => (
              <Checkbox
                checked={selectedRowIds.has(row.original.id)}
                onChange={() => toggleRowSelection(row.original.id)}
                sx={{
                  color: 'black',
                  '&.Mui-checked': {
                    color: 'black',
                  },
                }}
              />
            ),
          },
        ]
      : [];

    const dataColumns = columns.map((col) => ({ ...col }));
    return [...selectionColumn, ...dataColumns];
  }, [columns, showCheckbox, toggleRowSelection, selectedRowIds, toggleAllRows, data, isAllSelected, isSomeSelected]);

  const table = useReactTable({
    data,
    defaultColumn: { enableSorting: false },
    columns: memoizedColumns,
    filterFns: { fuzzy: fuzzyFilter },
    manualPagination: enablePagination,
    manualFiltering: true,
    state: {
      sorting,
      globalFilter: searchFilter,
      ...(enablePagination && { pagination: { pageIndex, pageSize } }),
    },
    globalFilterFn: fuzzyFilter,
    onGlobalFilterChange: onGlobalFilterChange,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: true,
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    enableMultiRowSelection: true,
  });

  const totalPages = Math.ceil((totalCount || 0) / pageSize);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          {onAddButtonClick && (
            <div className="text-white mr-4">
              <AddButton onClick={onAddButtonClick} title={addButtonText} size="medium" />
            </div>
          )}
          {showCheckbox && (
            <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="bulk-action-label" sx={{ color: 'white' }}>
                {t('common:table_grid.bulk_action')}
              </InputLabel>
              <Select
                labelId="bulk-action-label"
                value={bulkAction}
                onChange={handleSelectChange}
                label={t('common:table_grid.bulk_action')}
                sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.23)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'white',
                  },
                  '& .MuiSvgIcon-root': {
                    color: 'white',
                  },
                }}
              >
                <MenuItem value="">
                  <em>{t('common:table_grid.none')}</em>
                </MenuItem>
                {bulkActions.map((action) => (
                  <MenuItem key={action.value} value={action.value}>
                    {action.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </div>
        {showGlobalSearchField && (
          <TextField
            value={searchFilter}
            onChange={(e) => onGlobalFilterChange(e.target.value)}
            label={t('common:search')}
            variant="outlined"
            size="small"
            sx={{
              width: '16rem',
              backgroundColor: 'gray.600',
              border: '1px solid',
              borderColor: 'gray.500',
              '& .MuiInputBase-input': {
                color: 'white',
              },
              '& .MuiInputLabel-root': {
                color: 'white',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'white',
              },
            }}
            InputProps={{
              sx: { color: 'white' },
            }}
            InputLabelProps={{
              sx: { color: 'white' },
            }}
          />
        )}
      </div>

      {/* Header row */}
      <div className="flex items-center mb-1 text-white">
        <div className="flex-grow grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))' }}>
          {table.getHeaderGroups().map((headerGroup) => (
            <React.Fragment key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <div
                  key={header.id}
                  className={`${header.column.columnDef.meta?.className} px-3 col-span-${header.column.columnDef.meta?.width || 1} relative flex items-center h-full`}
                  onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                >
                  <div className="flex items-center w-full">
                    {header.column.columnDef.header === '' ? null : (
                      <div className="flex-grow">
                        {header.column.id === 'selection'
                          ? flexRender(header.column.columnDef.header, header.getContext())
                          : typeof header.column.columnDef.header === 'string'
                            ? header.column.columnDef.header
                            : flexRender(header.column.columnDef.header, header.getContext())}
                      </div>
                    )}
                    {header.column.getCanSort() && (
                      <div className="flex flex-col items-center ml-1">
                        <ArrowDropUp style={{ opacity: header.column.getIsSorted() === 'asc' ? 1 : 0.5 }} />
                        <ArrowDropDown style={{ opacity: header.column.getIsSorted() === 'desc' ? 1 : 0.5 }} />
                      </div>
                    )}
                  </div>
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
        table.getRowModel().rows.map((row) => (
          <React.Fragment key={row.id}>
            {/* Primary Row */}
            <div className={`flex items-stretch ${expandedRows.has(row.original.id) ? 'mb-0' : 'mb-1'}`}>
              <div className="flex-grow bg-edu-light-gray py-2">
                <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] items-center">
                  {row.getVisibleCells().map((cell) => (
                    <div
                      key={cell.id}
                      className={`${cell.column.columnDef.meta?.className} mr-3 ml-3 col-span-${cell.column.columnDef.meta?.width}`}
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
                <div className="w-20 flex-shrink-0 flex items-center justify-center py-2 pl-4">
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
            {/* Expandable Second Row */}
            {expandedRows.has(row.original.id) && expandableRowComponent && (
              <div className="flex mb-1">
                <div className="flex-grow bg-edu-light-gray py-2">
                  <ExpandableRowComponent key={`expandableRow-${row.id}`} row={row.original} />
                </div>
                <div className="w-10 flex-shrink-0"></div>
                {deleteMutation && <div className="w-20 flex-shrink-0"></div>}
              </div>
            )}
          </React.Fragment>
        ))}

      {/* Pagination */}
      {!loading && !error && enablePagination && totalCount > 0 && (
        <div className="flex justify-end pb-10 text-white mt-4">
          <div className="flex flex-row items-center space-x-5">
            {onPageSizeChange && (
              <FormControl sx={{ m: 1, minWidth: 130 }} size="small">
                <InputLabel id="page-size-select-label" sx={{ color: 'white' }}>
                  {t('common:table_grid.items_per_page')}
                </InputLabel>
                <Select
                  labelId="page-size-select-label"
                  id="page-size-select"
                  value={pageSize}
                  label={t('common:table_grid.items_per_page')}
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
              {t('common:table_grid.pagination_text', { currentPage: pageIndex + 1, totalPage: totalPages })}
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
