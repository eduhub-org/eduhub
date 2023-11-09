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

import {
  DegreeParticipantsWithDegreeEnrollments_Course_by_pk_CourseEnrollments,
} from '../../queries/__generated__/DegreeParticipantsWithDegreeEnrollments';

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
  disableSortBy?: boolean;
};

// Create a new type for your columns that includes both ColumnDef and your custom properties
type CustomColumnDef<TData extends object> = ColumnDef<TData> & CustomProps<TData>;

interface TableGridProps<T extends object> {
  data: T[];
  keyField: keyof T;
  columns: CustomColumnDef<T>;
  showCheckbox?: boolean;
  showDelete?: boolean;
  translationNamespace?: string;
}

export const TableGrid = <T extends object,>({
  data,
  keyField,
  // columns,
  showCheckbox,
  showDelete,
  translationNamespace,
}: TableGridProps<T>) => {
  const { t } = useTranslation(translationNamespace);

  const [sorting, setSorting] = useState<SortingState>([]);

    interface ExtendedDegreeParticipantsEnrollment
    extends DegreeParticipantsWithDegreeEnrollments_Course_by_pk_CourseEnrollments {
    name?: string;
    lastApplication?: string;
    ectsTotal?: string;
    attendedEvents?: number;
  }

const columns = useMemo<CustomColumnDef<ExtendedDegreeParticipantsEnrollment>[]>(
  () => [
    {
      header: 'Name',
      accessorKey: 'name',
      accessorFn: (row) => row.name,
      width: 3,
      cell: ({ cell }) => <div>{flexRender(cell.column.columnDef.cell, cell.getContext())}</div>,
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
          {row.getVisibleCells().map((cell) => {
            return (
              <div className={`${cell.column.} mr-3 ml-3 col-span-${col.width}`} key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};
