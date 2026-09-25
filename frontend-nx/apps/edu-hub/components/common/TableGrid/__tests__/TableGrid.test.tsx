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

const table = (data: TestRow[], loading: boolean, preserveRowsWhileLoading = false) => (
  <TableGrid
    columns={columns}
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

describe('TableGrid per-row options', () => {
  it('hides the expand chevron and adds classes for the rows it is told to', () => {
    render(
      <TableGrid<TestRow>
        columns={columns}
        data={[
          { id: 1, name: 'Editable' },
          { id: 2, name: 'Locked' },
        ]}
        enablePagination={false}
        error={undefined}
        loading={false}
        pageIndex={0}
        onPageChange={jest.fn()}
        refetchQueries={[]}
        searchFilter=""
        onSearchFilterChange={jest.fn()}
        showGlobalSearchField={false}
        expandableRowComponent={() => <div>details</div>}
        canExpandRow={(row) => row.id !== 2}
        rowClassName={(row) => (row.id === 2 ? 'locked-row' : '')}
      />
    );

    // Only the editable row gets an expand button.
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.getByText('Locked').closest('.locked-row')).toBeInTheDocument();
    expect(screen.getByText('Editable').closest('.locked-row')).not.toBeInTheDocument();
  });
});
