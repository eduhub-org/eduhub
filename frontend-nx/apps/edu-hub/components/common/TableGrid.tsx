import React, { useState, useMemo } from 'react';
import { DocumentNode } from '@apollo/client';
import { TextField } from '@material-ui/core';
import useTranslation from 'next-translate/useTranslation';
import ArrowDropUpIcon from '@material-ui/icons/ArrowDropUp';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
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
import { Button } from './Button';

interface BaseRow {
  id: number;
}

interface TableGridProps<T extends BaseRow> {
  data: T[];
  columns: ColumnDef<T>[];
  deleteMutation?: DocumentNode;
  enablePagination?: boolean;
  pageIndex?: number;
  refetchQueries: string[];
  setPageIndex?: (number) => void;
  showCheckbox?: boolean;
  showDelete?: boolean;
  showGlobalSearchField?: boolean;
  translationNamespace?: string;
}

const TableGrid = <T extends BaseRow>({
  data,
  columns,
  deleteMutation,
  enablePagination = false,
  pageIndex = 0,
  refetchQueries,
  setPageIndex,
  showCheckbox,
  showDelete,
  showGlobalSearchField = true,
  translationNamespace,
}: TableGridProps<T>) => {
  const { t } = useTranslation(translationNamespace);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  // Global filter function
  const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
    // Rank the item
    const itemRank = rankItem(row.getValue(columnId), value);
    // Store the itemRank info
    addMeta({
      itemRank,
    });
    // Return if the item should be filtered in/out
    return itemRank.passed;
  };

  const tableColumns = useMemo(() => {
    // Create the checkbox column if needed
    const checkboxColumn = showCheckbox
      ? [
          {
            id: 'selection',
            cell: ({ row }) => <input type="checkbox" />,
          },
        ]
      : [];

    // Create the data columns based on the input columns prop
    const dataColumns = columns.map((col) => ({
      ...col,
    }));

    // Create the delete column if needed
    const deleteColumn =
      showDelete && deleteMutation
        ? [
            {
              id: 'delete',
              cell: ({ row }) =>
                deleteMutation && (
                  <TableGridDeleteButton deleteMutation={deleteMutation} id={row.original.id} refetchQueries={refetchQueries} />
                ),
            },
          ]
        : [];

    // Combine the columns without mutations
    return [...checkboxColumn, ...dataColumns, ...deleteColumn];
  }, [columns, deleteMutation, refetchQueries, showCheckbox, showDelete]);

  const table = useReactTable({
    data,
    defaultColumn: {
      enableSorting: false,
    },
    columns: tableColumns,
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    state: {
      sorting,
      globalFilter,
      ...(enablePagination && {
        pagination: {
          pageIndex,
          pageSize: 15,
        },
      }),
    },
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
      {/* Global Search Input */}
      {showGlobalSearchField && (
        <div className="flex justify-end">
          <TextField
            className="!w-64 bg-gray-600 border !mb-6"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            label="Search"
            variant="outlined"
            size="small"
            fullWidth
            InputProps={{
              style: {
                color: 'white', // Text color
                borderColor: 'white', // Border color,
              },
            }}
            InputLabelProps={{
              style: { color: 'white' }, // Label color
            }}
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
                className={`${header.column.columnDef.meta?.className} mr-3 ml-3 col-span-${header.column.columnDef.meta?.width} relative`}
                key={header.id}
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
        <div
          className="${className} grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] items-center mb-1 py-2 bg-edu-light-gray"
          key={row.id}
        >
          {row.getVisibleCells().map((cell) => {
            return (
              <div
                className={`${cell.column.columnDef.meta?.className} mr-3 ml-3 col-span-${cell.column.columnDef.meta?.width}`}
                key={cell.id}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </div>
            );
          })}
        </div>
      ))}

      {enablePagination && (
        <div className="flex justify-between items-center mt-4">
          <Button onClick={() => setPageIndex((old) => Math.max(old - 1, 0))} disabled={pageIndex === 0}>
            Previous Page
          </Button>
          <span>
            Page{' '}
            <strong>
              {pageIndex + 1} of {table.getPageCount()}
            </strong>
          </span>
          <Button
            onClick={() => setPageIndex((old) => (old < table.getPageCount() - 1 ? old + 1 : old))}
            disabled={pageIndex >= table.getPageCount() - 1}
          >
            Next Page
          </Button>
        </div>
      )}
    </div>
  );
};

export default TableGrid;
