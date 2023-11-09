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

// Define a type for your custom properties
type CustomProps<TData extends object> = {
  width: number;
  className?: string;
  disableSortBy?: boolean;
};

// Create a new type for your columns that includes both ColumnDef and your custom properties
export type CustomColumnDef<TData extends object> = ColumnDef<TData> & CustomProps<TData>;

interface TableGridProps<T extends object> {
  data: T[];
  columns: CustomColumnDef<T>[];
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
      disableSortBy: col.disableSortBy,
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
      <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] mb-1 text-white">
        {showCheckbox && <div className="col-span-1" />}
        {table.getHeaderGroups().map((headerGroup) => (
          <div key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <div
                className={`mr-3 ml-3 relative`}
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
          </div>
        ))}
        {showDelete && <div className="ml-3 col-span-2" />}
      </div>

      {/* Data Rows */}
      {table.getRowModel().rows.map((row) => (
        <div
          className="${className} grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] mb-1 bg-edu-light-gray"
          key={row.id}
        >
          {row.getVisibleCells().map((cell) => {
            return (
              <div className={`mr-3 ml-3`} key={cell.id}>
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
