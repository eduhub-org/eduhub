import React, { useState, useMemo, useCallback, ReactElement, Dispatch, SetStateAction } from 'react';
import { ApolloError, DocumentNode } from '@apollo/client';
import {
  CircularProgress,
  TextField,
  Checkbox,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  SelectChangeEvent,
} from '@mui/material';
import useTranslation from 'next-translate/useTranslation';
import { ArrowDropUp, ArrowDropDown } from '@mui/icons-material';
import { MdArrowBack, MdArrowForward } from 'react-icons/md';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  useReactTable,
  FilterFn,
  OnChangeFn,
} from '@tanstack/react-table';
import { rankItem } from '@tanstack/match-sorter-utils';

import TableGridDeleteButton from './TableGridDeleteButton';
import EhAddButton from '../common/EhAddButton';

interface BaseRow {
  id: number;
}

interface BulkAction {
  value: string;
  label: string;
}

interface TableGridProps<T extends BaseRow> {
  addButtonText?: string;
  data: T[];
  columns: ColumnDef<T>[];
  deleteMutation?: DocumentNode;
  deleteIdType?: 'number' | 'uuidString';
  generateDeletionConfirmationQuestion?: (row: T) => string;
  enablePagination?: boolean;
  error: ApolloError;
  expandableRowComponent?: (props: { row: T }) => ReactElement | null;
  loading: boolean;
  pageIndex?: number;
  pages?: number;
  refetchQueries: string[];
  searchFilter?: string;
  setPageIndex?: (number) => void;
  setSearchFilter?: Dispatch<SetStateAction<string>>;
  showCheckbox?: boolean;
  showDelete?: boolean;
  showGlobalSearchField?: boolean;
  translationNamespace?: string;
  onAddButtonClick?: () => void;
  onBulkAction?: (action: string, selectedRows: T[]) => void;
  bulkActions?: BulkAction[];
}

const TableGrid = <T extends BaseRow>({
  addButtonText,
  data,
  columns,
  deleteMutation,
  deleteIdType,
  generateDeletionConfirmationQuestion,
  enablePagination = false,
  error,
  expandableRowComponent,
  loading,
  pageIndex = 0,
  pages,
  refetchQueries,
  searchFilter,
  setSearchFilter,
  setPageIndex,
  showCheckbox = false,
  showDelete,
  showGlobalSearchField = true,
  translationNamespace,
  onAddButtonClick,
  onBulkAction,
  bulkActions = [],
}: TableGridProps<T>) => {
  const { t } = useTranslation(translationNamespace);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [bulkAction, setBulkAction] = useState<string>('');

  const handlePrevious = () => setPageIndex(Math.max(0, pageIndex - 1));
  const handleNext = () => setPageIndex(pageIndex + 1);

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

  const toggleRowSelection = useCallback(
    (rowId: number) => {
      const newSelectedRows = new Set(selectedRows);
      if (selectedRows.has(rowId)) {
        newSelectedRows.delete(rowId);
      } else {
        newSelectedRows.add(rowId);
      }
      setSelectedRows(newSelectedRows);
    },
    [selectedRows]
  );

  const toggleAllRows = useCallback(() => {
    if (selectedRows.size === data.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(data.map((row) => row.id)));
    }
  }, [data, selectedRows]);

  const handleBulkActionChange = (event: SelectChangeEvent<string>) => {
    const action = event.target.value;
    if (onBulkAction && action) {
      const selectedRowsData = data.filter((row) => selectedRows.has(row.id));
      onBulkAction(action, selectedRowsData);
      setSelectedRows(new Set()); // Clear selections after action
    }
  };

  const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
    const itemRank = rankItem(row.getValue(columnId), value);
    addMeta({ itemRank });
    return itemRank.passed;
  };

  const onGlobalFilterChange: OnChangeFn<string> = useCallback(
    async (value) => {
      setSearchFilter(value);
      setPageIndex(0);
    },
    [setPageIndex, setSearchFilter]
  );

  const tableColumns = useMemo(() => {
    const selectionColumn: ColumnDef<T>[] = showCheckbox
      ? [
          {
            id: 'selection',
            header: ({ table }) => (
              <Checkbox
                checked={table.getIsAllPageRowsSelected()}
                indeterminate={table.getIsSomePageRowsSelected()}
                onChange={table.getToggleAllPageRowsSelectedHandler()}
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
                checked={row.getIsSelected()}
                onChange={row.getToggleSelectedHandler()}
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
  }, [columns, showCheckbox]);

  const table = useReactTable({
    data,
    defaultColumn: { enableSorting: false },
    columns: tableColumns,
    filterFns: { fuzzy: fuzzyFilter },
    state: {
      sorting,
      globalFilter: searchFilter,
      ...(enablePagination && { pagination: { pageIndex, pageSize: 15 } }),
    },
    globalFilterFn: fuzzyFilter,
    onGlobalFilterChange: onGlobalFilterChange,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    debugTable: true,
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    enableMultiRowSelection: true,
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        {onAddButtonClick && (
          <div className="text-white">
            <EhAddButton buttonClickCallBack={onAddButtonClick} text={addButtonText} />
          </div>
        )}
        {showCheckbox && bulkActions.length > 0 && (
          <div className="flex items-center">
            <FormControl variant="outlined" size="small" style={{ minWidth: 200 }}>
              <InputLabel id="bulk-action-label" style={{ color: 'white' }}>
                {t('common:table_grid.bulk_action')}
              </InputLabel>
              <Select
                labelId="bulk-action-label"
                value={bulkAction}
                onChange={handleBulkActionChange}
                label={t('common:table_grid.bulk_action')}
                className="bg-gray-600 border"
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
          </div>
        )}
        {showGlobalSearchField && (
          <TextField
            className="!w-64 bg-gray-600 border"
            value={searchFilter}
            onChange={(e) => onGlobalFilterChange(e.target.value)}
            label={t('common:search')}
            variant="outlined"
            size="small"
            fullWidth
            slotProps={{
              input: { style: { color: 'white', borderColor: 'white' } },
              inputLabel: { style: { color: 'white' } },
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
                          : t(header.column.id)}
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
        {showDelete && <div className="w-20 flex-shrink-0" />}
        {expandableRowComponent && <div className="w-10 flex-shrink-0" />}
      </div>

      {/* Data Rows */}
      {!loading &&
        !error &&
        table.getRowModel().rows.map((row) => (
          <React.Fragment key={row.id}>
            {/* Primary Row */}
            <div className="flex items-stretch mb-1">
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
              {showDelete && deleteMutation && (
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
                {showDelete && <div className="w-20 flex-shrink-0"></div>}
              </div>
            )}
          </React.Fragment>
        ))}

      {/* Pagination */}
      {!loading && !error && enablePagination && (
        <div className="flex justify-end pb-10 text-white mt-4">
          <div className="flex flex-row items-center space-x-5">
            {pageIndex > 0 && (
              <MdArrowBack
                className="border-2 rounded-full cursor-pointer hover:bg-indigo-100"
                size={30}
                onClick={handlePrevious}
              />
            )}
            <p className="font-medium">
              {t('common:table_grid.pagination_text', { currentPage: pageIndex + 1, totalPage: pages })}
            </p>
            {pageIndex < (pages ?? 0) - 1 && (
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
