import React, { useState, useMemo } from 'react';
import { IconButton } from '@material-ui/core';
import { MdDelete } from 'react-icons/md';

interface TableColumn<T> {
  columnName: string;
  width: number;
  className?: string;
  displayComponent: React.FC<{ rowData: T }>;
  sortFunction?: (a: T, b: T, direction: 'asc' | 'desc') => number;
}

interface TableGridProps<T> {
  data: T[];
  keyField: keyof T;
  columns: TableColumn<T>[];
  showCheckbox?: boolean;
  showDelete?: boolean;
}

export const TableGrid = <T,>({
  data,
  keyField,
  columns,
  showCheckbox,
  showDelete
}: TableGridProps<T>) => {
  
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (columnName: string) => {
    if (sortColumn === columnName) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnName);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return data;

    const column = columns.find(col => col.columnName === sortColumn);
    const sortFunction = column?.sortFunction || ((a, b, direction) => {
      const valueA = a[sortColumn];
      const valueB = b[sortColumn];
      return valueA < valueB ? (direction === 'asc' ? -1 : 1) : (direction === 'asc' ? 1 : -1);
    });

    return [...data].sort((a, b) => sortFunction(a, b, sortDirection));
  }, [data, sortColumn, sortDirection, columns]);

  return (
    <div>
      {/* Header row for column names */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] mb-1 text-white">
        {showCheckbox && <div className="col-span-1" />}
        {columns.map((col) => (
          <div
            className={`${col.className} mr-3 ml-3 col-span-${col.width}`}
            key={col.columnName}
            onClick={() => handleSort(col.columnName)}
          >
            {col.columnName}
            {sortColumn === col.columnName && (sortDirection === 'asc' ? '↑' : '↓')}
          </div>
        ))}
        {showDelete && <div className="ml-3 col-span-2" />}
      </div>

      {/* Data Rows */}
      {sortedData.map((row) => (
        <div
          className="${className} grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] mb-1 bg-edu-light-gray"
          key={row[keyField as string]}
        >
          {/* Optional Checkbox Column */}
          {showCheckbox && (
            <div className="col-span-1">
              <input type="checkbox" />
            </div>
          )}

          {/* Data Columns */}
          {columns.map((col) => (
            <div
              className={`${col.className} mr-3 ml-3 col-span-${col.width}`}
              key={col.columnName}
            >
              <col.displayComponent rowData={row} />
            </div>
          ))}

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
