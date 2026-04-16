import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import TableGrid from './index';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

interface TestRow {
  id: number;
  name: string;
  createdAt: unknown;
}

const baseData: TestRow[] = [
  { id: 1, name: 'Alice', createdAt: '2026-03-01T00:00:00.000Z' },
  { id: 2, name: 'Bob', createdAt: 'invalid-date-value' },
];

const commonProps = {
  loading: false,
  error: undefined,
  refetchQueries: [],
  enablePagination: false,
  pageIndex: 0,
  onPageChange: jest.fn(),
  searchFilter: '',
  onSearchFilterChange: jest.fn(),
  showGlobalSearchField: false,
};

describe('TableGrid defensive rendering and sorting', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders a fallback value when a cell renderer throws', () => {
    const columns: ColumnDef<TestRow>[] = [
      {
        header: 'Name',
        accessorKey: 'name',
        cell: ({ row }) => row.original.name,
      },
      {
        id: 'createdAt',
        header: 'Created At',
        accessorKey: 'createdAt',
        cell: () => {
          throw new Error('cell render failed');
        },
      },
    ];

    render(<TableGrid<TestRow> data={baseData} columns={columns} {...commonProps} />);

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('TableGrid: Failed to render cell for column "createdAt"'),
      expect.any(Error)
    );
  });

  it('falls back to safe sorting when a custom sort function throws', () => {
    const columns: ColumnDef<TestRow>[] = [
      {
        header: 'Name',
        accessorKey: 'name',
        cell: ({ row }) => row.original.name,
      },
      {
        id: 'createdAt',
        header: 'Created At',
        accessorKey: 'createdAt',
        enableSorting: true,
        sortingFn: () => {
          throw new Error('custom sort failed');
        },
        cell: ({ row }) => String(row.original.createdAt ?? ''),
      },
    ];

    render(<TableGrid<TestRow> data={baseData} columns={columns} {...commonProps} />);

    fireEvent.click(screen.getByText('Created At'));

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('TableGrid: Custom sort failed for column "createdAt"'),
      expect.any(Error)
    );
  });

  it('does not crash when expandable row rendering throws', () => {
    const columns: ColumnDef<TestRow>[] = [
      {
        header: 'Name',
        accessorKey: 'name',
        cell: ({ row }) => row.original.name,
      },
    ];

    render(
      <TableGrid<TestRow>
        data={baseData}
        columns={columns}
        expandableRowComponent={() => {
          throw new Error('expandable row failed');
        }}
        {...commonProps}
      />
    );

    fireEvent.click(screen.getAllByRole('button')[0]);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'TableGrid: Failed to render expandable row',
      expect.any(Error)
    );
  });
});
