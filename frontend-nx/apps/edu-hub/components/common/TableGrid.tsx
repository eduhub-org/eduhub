import React, { useState, useMemo, useCallback } from 'react';
import { DocumentNode } from '@apollo/client';
import { TextField } from '@material-ui/core';
import useTranslation from 'next-translate/useTranslation';
import ArrowDropUpIcon from '@material-ui/icons/ArrowDropUp';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import { MdArrowBack, MdArrowForward } from 'react-icons/md';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  useReactTable,
  FilterFn,
} from '@tanstack/react-table';
import { rankItem } from '@tanstack/match-sorter-utils';

import TableGridDeleteButton from './TableGridDeleteButton';
import EhAddButton from '../common/EhAddButton';

interface BaseRow {
  id: number;
}

interface TableGridProps<T extends BaseRow> {
  addButtonText?: string;
  data: T[];
  columns: ColumnDef<T>[];
  deleteMutation?: DocumentNode;
  enablePagination?: boolean;
  pageIndex?: number;
  pages?: number;
  refetchQueries: string[];
  setPageIndex?: (number) => void;
  showCheckbox?: boolean;
  showDelete?: boolean;
  showGlobalSearchField?: boolean;
  translationNamespace?: string;
  onAddButtonClick?: () => void; // Optional Add button callback
}

const TableGrid = <T extends BaseRow>({
  addButtonText,
  data,
  columns,
  deleteMutation,
  enablePagination = false,
  pageIndex = 0,
  pages,
  refetchQueries,
  setPageIndex,
  showCheckbox,
  showDelete,
  showGlobalSearchField = true,
  translationNamespace,
  onAddButtonClick, // Add button callback
}: TableGridProps<T>) => {
  const { t } = useTranslation(translationNamespace);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const handlePrevious = () => setPageIndex(Math.max(0, pageIndex - 1));
  const handleNext = () => setPageIndex(pageIndex + 1);

  const toggleRowExpansion = useCallback((rowId: number) => {
    const newExpandedRows = new Set(expandedRows);
    if (expandedRows.has(rowId)) {
      newExpandedRows.delete(rowId);
    } else {
      newExpandedRows.add(rowId);
    }
    setExpandedRows(newExpandedRows);
  },[expandedRows]);

  const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
    const itemRank = rankItem(row.getValue(columnId), value);
    addMeta({ itemRank });
    return itemRank.passed;
  };

  const tableColumns = useMemo(() => {
    const expandCollapseColumn: ColumnDef<T>[] = [
      {
        id: 'expander',
        cell: ({ row }) => (
          <button onClick={() => toggleRowExpansion(row.original.id)}>
            {expandedRows.has(row.original.id) ? '👇' : '👉'}
          </button>
        ),
      },
    ];

    const dataColumns = columns.map((col) => ({ ...col }));
    const deleteColumn =
      showDelete && deleteMutation
        ? [
            {
              id: 'delete',
              cell: ({ row }) =>
                deleteMutation && (
                  <TableGridDeleteButton
                    deleteMutation={deleteMutation}
                    id={row.original.id}
                    refetchQueries={refetchQueries}
                  />
                ),
            },
          ]
        : [];
    return [...expandCollapseColumn, ...dataColumns, ...deleteColumn];
  }, [columns, deleteMutation, refetchQueries, showDelete, expandedRows, toggleRowExpansion]);

  const table = useReactTable({
    data,
    defaultColumn: { enableSorting: false },
    columns: tableColumns,
    filterFns: { fuzzy: fuzzyFilter },
    state: { sorting, globalFilter, ...(enablePagination && { pagination: { pageIndex, pageSize: 15 } }) },
    globalFilterFn: fuzzyFilter,
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    debugTable: true,
    getRowId: (row) => row.id.toString(),
  });

  return (
    <div>
      {/* Optional Add Button */}
      {onAddButtonClick && (
        <div className="text-white mb-4">
          <EhAddButton buttonClickCallBack={onAddButtonClick} text={addButtonText} />
        </div>
      )}

      {/* Global Search Input */}
      {showGlobalSearchField && (
        <div className="flex justify-end">
          <TextField
            className="!w-64 bg-gray-600 border !mb-6"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            label={t('search')}
            variant="outlined"
            size="small"
            fullWidth
            InputProps={{ style: { color: 'white', borderColor: 'white' } }}
            InputLabelProps={{ style: { color: 'white' } }}
          />
        </div>
      )}

      {/* Header row for column names */}
      <div>
        {table.getHeaderGroups().map((headerGroup) => (
          <div
            key={headerGroup.id}
            className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] mb-1 text-white items-center"
          >
            {showCheckbox && <div className="col-span-1" />}
            {headerGroup.headers.map((header) => (
              <div
                key={header.id}
                className={`${header.column.columnDef.meta?.className} mr-3 ml-3 col-span-${header.column.columnDef.meta?.width} relative`}
                onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
              >
                <div className="flex-1 flex items-center">
                  <div>{t(header.column.id)}</div>
                  {header.column.getCanSort() && (
                    <div className="ml-1 flex flex-col items-center">
                      <ArrowDropUpIcon style={{ opacity: header.column.getIsSorted() === 'asc' ? 1 : 0.5 }} />
                      <ArrowDropDownIcon style={{ opacity: header.column.getIsSorted() === 'desc' ? 1 : 0.5 }} />
                    </div>
                  )}
                </div>
              </div>
            ))}
            {showDelete && <div className="ml-3 col-span-2" />}
          </div>
        ))}
      </div>

      {/* Data Rows */}
      {table.getRowModel().rows.map((row) => (
        <React.Fragment key={row.id}>
          {/* Primary Row */}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] items-center mb-1 py-2 bg-edu-light-gray">
            {row.getVisibleCells().map((cell) => (
              <div
                key={cell.id}
                className={`${cell.column.columnDef.meta?.className} mr-3 ml-3 col-span-${cell.column.columnDef.meta?.width}`}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </div>
            ))}
          </div>
          {/* Expandable Second Row */}
          {expandedRows.has(row.original.id) && (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] items-center mb-1 py-2 bg-edu-light-gray">
              {table.getAllColumns().map((column) => {
                if (!column.columnDef.meta?.secondRowComponent) return null; // Skip columns without secondRowComponent
                const SecondRowComponent = column.columnDef.meta.secondRowComponent;
                return (
                  <div key={column.id} className="col-span-full">
                    <SecondRowComponent row={row} />
                  </div>
                );
              })}
            </div>
          )}
        </React.Fragment>
      ))}

      {/* Pagination */}
      {enablePagination && (
        <div className="flex justify-end pb-10 text-white">
          <div className="flex flex-row space-x-5">
            {pageIndex > 0 && (
              <MdArrowBack
                className="border-2 rounded-full cursor-pointer hover:bg-indigo-100"
                size={40}
                onClick={handlePrevious}
              />
            )}
            <p className="font-medium">{t('paginationText', { currentPage: pageIndex + 1, totalPage: pages })}</p>
            {pageIndex < pages - 1 && (
              <MdArrowForward
                className="border-2 rounded-full cursor-pointer hover:bg-indigo-100"
                size={40}
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
