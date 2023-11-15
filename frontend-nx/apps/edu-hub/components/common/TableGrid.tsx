import React, { useState, useMemo } from 'react';
import { IconButton } from '@material-ui/core';
import { MdDelete } from 'react-icons/md';
import useTranslation from 'next-translate/useTranslation';
import ArrowDropUpIcon from '@material-ui/icons/ArrowDropUp';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';

interface TableGridProps<T extends object> {
  data: T[];
  columns: ColumnDef<T>[];
  showCheckbox?: boolean;
  showDelete?: boolean;
  translationNamespace?: string;
}

const TableGrid = <T extends object>({
  data,
  columns,
  showCheckbox,
  showDelete,
  translationNamespace,
}: TableGridProps<T>) => {
  const { t } = useTranslation(translationNamespace);

  const [sorting, setSorting] = useState<SortingState>([]);

  const tableColumns = useMemo(() => {
    // Create the checkbox column if needed
    const checkboxColumn = showCheckbox
      ? [
          {
            id: 'selection',
            accessorFn: (row) => row.name,
            Header: () => <div>Select</div>,
            Cell: ({ row }) => <input type="checkbox" />,
          },
        ]
      : [];

    // Create the data columns based on the input columns prop
    const dataColumns = columns.map((col) => ({
      ...col,
    }));

    // Create the delete column if needed
    const deleteColumn = showDelete
      ? [
          {
            id: 'delete',
            accessorFn: (row) => row.name,
            Header: () => <div>Delete</div>,
            Cell: ({ row }) => (
              <IconButton size="small">
                <MdDelete size="1.25em" />
              </IconButton>
            ),
          },
        ]
      : [];

    // Combine the columns without mutations
    return [...checkboxColumn, ...dataColumns, ...deleteColumn];
  }, [columns, showCheckbox, showDelete]);

  const table = useReactTable({
    data,
    defaultColumn: {
      enableSorting: false,
    },
    columns: tableColumns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: true,
  });

  return (
    <div>
      {/* Header row for column names */}
      <div>
        {table.getHeaderGroups().map((headerGroup) => (
          <div key={headerGroup.id} className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] mb-1 text-white">
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
          className="${className} grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] mb-1 bg-edu-light-gray"
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
    </div>
  );
};

export default TableGrid;
