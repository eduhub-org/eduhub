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

// interface TableColumn<T> {
//   width: number;
//   className?: string;
//   displayComponent: React.FC<{ rowData: T }>;
//   sortAsNumber?: boolean;
//   disableSorting?: boolean;
// }

// Define a type for your custom properties
type CustomProps<TData extends object> = {
  width: number;
  className?: string;
  disableSorting?: boolean;
};

// Create a new type for your columns that includes both ColumnDef and your custom properties
type CustomColumnDef<TData extends object> = ColumnDef<TData> & CustomProps<TData>;

interface TableGridProps<T> {
  data: T[];
  keyField: keyof T;
  columns: CustomColumnDef<T>;
  showCheckbox?: boolean;
  showDelete?: boolean;
  translationNamespace?: string;
}

export const TableGrid = <T,>({
  data,
  keyField,
  // columns,
  showCheckbox,
  showDelete,
  translationNamespace,
}: TableGridProps<T>) => {
  const { t } = useTranslation(translationNamespace);

  const [sorting, setSorting] = useState<SortingState>([]);

const columns = useMemo<CustomColumnDef<Person>[]>(
  () => [
    {
      header: 'Name',
      accessorKey: 'name',
      width: 3,
      cell: ({ row }) => (
        <div>
          {row.} {rowData?.User.lastName}
        </div>
      ),
    },
  ],
  []
);

const tableColumns = useMemo(() => {
  // Create the checkbox column if needed
  const checkboxColumn = showCheckbox
    ? [
        {
          id: 'selection',
          Header: () => <div>Select</div>,
          Cell: ({ row }) => <input type="checkbox" />,
        },
      ]
    : [];

  // Create the data columns based on the input columns prop
  const dataColumns = columns.map((col) => ({
    Header: col.columnName,
    accessor: col.columnName,
    Cell: ({ value }) => <col.displayComponent rowData={value} />,
    disableSortBy: col.disableSorting,
  }));

  // Create the delete column if needed
  const deleteColumn = showDelete
    ? [
        {
          id: 'delete',
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
    columns,
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
          <div
            className={`${headerGroup.className} mr-3 ml-3 col-span-${headerGroup.width} relative`}
            key={headerGroup.id}
            onClick={!headerGroup.disableSorting ? () => handleSort(headerGroup.columnName) : undefined}
          >
            <div className="flex-1 flex items-center">
              <div>{t(col)}</div>
              {!headerGroup.disableSorting && (
                <div className="ml-1 flex flex-col items-center">
                  <ArrowDropUpIcon
                    style={{ opacity: sortColumn === headerGroup.columnName && sortDirection === 'asc' ? 1 : 0.5 }}
                  />
                  <ArrowDropDownIcon
                    style={{ opacity: sortColumn === headerGroup.columnName && sortDirection === 'desc' ? 1 : 0.5 }}
                  />
                </div>
              )}
            </div>
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
          {/* Optional Checkbox Column */}
          {showCheckbox && (
            <div className="col-span-1">
              <input type="checkbox" />
            </div>
          )}

          {/* Data Columns */}
          {columns.map((col) => (
            <div className={`${col.className} mr-3 ml-3 col-span-${col.width}`} key={col.columnName}>
              <col.displayComponent rowData={row} />
            </div>
          ))}
          {row.getVisibleCells().map((cell) => {
            return (
              <div className={`${col.className} mr-3 ml-3 col-span-${col.width}`} key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </div>
            );
          })}

          {/* Optional Delete Column */}
          {showDelete && (
            <div className="ml-3 col-span-2">
              <IconButton size="small">
                <MdDelete size="1.25em" />
              </IconButton>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
