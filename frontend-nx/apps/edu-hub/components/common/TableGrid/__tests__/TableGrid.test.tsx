import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ColumnDef } from '@tanstack/react-table';

import TableGrid from '..';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock('next/router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

interface TestRow {
  id: number;
  name: string;
}

const columns: ColumnDef<TestRow>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => <span>{row.original.name}</span>,
  },
];

const table = (
  data: TestRow[],
  loading: boolean,
  preserveRowsWhileLoading = false,
  pageColumns = columns
) => (
  <TableGrid
    columns={pageColumns}
    data={data}
    enablePagination
    error={undefined}
    loading={loading}
    pageIndex={0}
    onPageChange={jest.fn()}
    pageSize={20}
    totalCount={40}
    onPageSizeChange={jest.fn()}
    refetchQueries={[]}
    searchFilter=""
    onSearchFilterChange={jest.fn()}
    showGlobalSearchField={false}
    preserveRowsWhileLoading={preserveRowsWhileLoading}
  />
);

describe('TableGrid loading behavior', () => {
  it('retains cell renderers and their query context until the replacement page settles', () => {
    const attendanceColumns = (sessions: string[]): ColumnDef<TestRow>[] => [{
      accessorKey: 'name',
      header: 'Attendance',
      cell: ({ row }) => (
        <div>
          {row.original.name}
          {sessions.map((session) => <span key={session}>{session}</span>)}
        </div>
      ),
    }];
    const settledColumns = attendanceColumns(['Session 1', 'Session 2']);
    const { rerender } = render(table([{ id: 1, name: 'Previous page' }], false, true, settledColumns));
    const previousCell = screen.getByText('Previous page');

    // The participant query clears its data, including sessions, on a cache miss.
    rerender(table([], true, true, attendanceColumns([])));
    expect(screen.getByText('Session 1')).toBeInTheDocument();
    expect(screen.getByText('Session 2')).toBeInTheDocument();
    expect(screen.getByText('Previous page')).toBe(previousCell);

    // Participants arrive before the separate attendance query has settled.
    rerender(table([{ id: 2, name: 'Next page' }], true, true, attendanceColumns(['New session'])));
    expect(screen.getByText('Previous page')).toBe(previousCell);
    expect(screen.queryByText('New session')).not.toBeInTheDocument();
    expect(screen.getByText('common.table_grid.pagination_text')).toBeInTheDocument();

    rerender(table([{ id: 2, name: 'Next page' }], false, true, attendanceColumns(['New session'])));
    expect(screen.queryByText('Previous page')).not.toBeInTheDocument();
    expect(screen.queryByText('Session 1')).not.toBeInTheDocument();
    expect(screen.getByText('Next page')).toBeInTheDocument();
    expect(screen.getByText('New session')).toBeInTheDocument();
  });

  it('retains the last settled rows when opted in', () => {
    const { rerender } = render(table([{ id: 1, name: 'Previous page' }], false, true));

    rerender(table([], true, true));

    expect(screen.getByText('Previous page')).toBeInTheDocument();
    expect(screen.getByText('Previous page').closest('[inert]')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('common.table_grid.pagination_text')).toBeInTheDocument();

    rerender(table([{ id: 2, name: 'Next page' }], false, true));

    expect(screen.queryByText('Previous page')).not.toBeInTheDocument();
    expect(screen.getByText('Next page')).toBeInTheDocument();
    expect(screen.getByText('Next page').closest('[inert]')).not.toBeInTheDocument();
  });

  it('keeps the existing empty loading behavior by default', () => {
    const { rerender } = render(table([{ id: 1, name: 'Previous page' }], false));

    rerender(table([], true));

    expect(screen.queryByText('Previous page')).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.queryByText('common.table_grid.pagination_text')).not.toBeInTheDocument();
  });
});
