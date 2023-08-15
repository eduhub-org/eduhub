import React from 'react';
import { IconButton } from '@material-ui/core';
import { MdDelete } from 'react-icons/md';

interface TableColumn<T> {
  columnName: string;
  width: number;
  displayComponent: React.FC<{ rowData: T }>;
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
  showDelete,
}: TableGridProps<T>) => {
  return (
    <div>
      {/* Header row for column names */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] mb-1 bg-edu-light-gray">
        {showCheckbox && <div className="col-span-1" />}
        {columns.map((col) => (
          <div
            className={`mr-3 ml-3 col-span-${col.width}`}
            key={col.columnName}
          >
            {col.columnName}
          </div>
        ))}
        {showDelete && <div className="ml-3 col-span-2" />}
      </div>

      {/* Data Rows */}
      {data.map((row) => (
        <div
          className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] mb-1 bg-edu-light-gray"
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
              className={`mr-3 ml-3 col-span-${col.width}`}
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
