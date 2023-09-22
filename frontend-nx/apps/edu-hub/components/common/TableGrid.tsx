import React, { useState, useMemo } from 'react';
import { IconButton } from '@material-ui/core';
import { MdDelete } from 'react-icons/md';
import useTranslation from 'next-translate/useTranslation';
import ArrowDropUpIcon from '@material-ui/icons/ArrowDropUp';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import { orderBy } from 'lodash';

interface TableColumn<T> {
  columnName: string;
  width: number;
  className?: string;
  displayComponent: React.FC<{ rowData: T }>;
  sortValueFunction?: (data:T[]) => number;
  disableSorting?: boolean;
}

interface TableGridProps<T> {
  data: T[];
  keyField: keyof T;
  columns: TableColumn<T>[];
  showCheckbox?: boolean;
  showDelete?: boolean;
  translationNamespace?: string;
}

export const TableGrid = <T,>({
  data,
  keyField,
  columns,
  showCheckbox,
  showDelete,
  translationNamespace,
}: TableGridProps<T>) => {

  const {t} = useTranslation(translationNamespace);
  
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (columnName: string) => {
    // Find the corresponding column object
    const column = columns.find(col => col.columnName === columnName);

    // If sorting is disabled for this column, return early and do nothing
    if (column?.disableSorting) {
      return;
    }

    if (sortColumn === columnName) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnName);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return data;

  const sorted = orderBy(data, [sortColumn], [sortDirection]);
    return sorted;
  }, [data, sortColumn, sortDirection]);

  return (
    <div>
      {/* Header row for column names */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] mb-1 text-white">
        {showCheckbox && <div className="col-span-1" />}
        {columns.map((col) => (
  <div
    className={`${col.className} mr-3 ml-3 col-span-${col.width} relative`}
    key={col.columnName}
    onClick={!col.disableSorting ? () => handleSort(col.columnName) : undefined}
  >
    <div className="flex-1 flex items-center">
      <div>{t(col.columnName)}</div>
      {!col.disableSorting && (
        <div className="ml-1 flex flex-col items-center">
          <ArrowDropUpIcon style={{ opacity: sortColumn === col.columnName && sortDirection === 'asc' ? 1 : 0.5 }} />
          <ArrowDropDownIcon style={{ opacity: sortColumn === col.columnName && sortDirection === 'desc' ? 1 : 0.5 }} />
        </div>
      )}
    </div>
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
