import { fireEvent, render, screen } from '@testing-library/react';
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

/** jsdom has no matchMedia; answer every query with `matches`. */
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }),
  });
};

describe('TableGrid responsive options', () => {
  afterEach(() => {
    delete (window as { matchMedia?: unknown }).matchMedia;
  });

  const responsiveColumns: ColumnDef<TestRow>[] = [
    ...columns,
    {
      id: 'extra',
      header: 'Extra',
      meta: { hideBelow: 'xl' },
      cell: () => <span>extra cell</span>,
    },
  ];

  const renderGrid = (props: Partial<React.ComponentProps<typeof TableGrid<TestRow>>> = {}) =>
    render(
      <TableGrid<TestRow>
        columns={responsiveColumns}
        data={[{ id: 1, name: 'Row one' }]}
        enablePagination={false}
        error={undefined}
        loading={false}
        pageIndex={0}
        onPageChange={jest.fn()}
        refetchQueries={[]}
        searchFilter=""
        onSearchFilterChange={jest.fn()}
        showGlobalSearchField={false}
        {...props}
      />
    );

  it('shows every column when the screen size is unknown', () => {
    renderGrid();
    expect(screen.getByText('Extra')).toBeInTheDocument();
    expect(screen.getByText('extra cell')).toBeInTheDocument();
  });

  it('drops columns marked hideBelow on narrower screens', () => {
    mockMatchMedia(true);
    renderGrid();
    expect(screen.queryByText('Extra')).not.toBeInTheDocument();
    expect(screen.queryByText('extra cell')).not.toBeInTheDocument();
    expect(screen.getByText('Row one')).toBeInTheDocument();
  });

  it('renders the mobile card summary on phones when one is provided', () => {
    mockMatchMedia(true);
    renderGrid({ renderMobileRow: (row) => <span>card {row.name}</span> });
    expect(screen.getByText('card Row one')).toBeInTheDocument();
    expect(screen.queryByText('Name')).not.toBeInTheDocument();
  });

  it('replaces the missing header row on phones with select-all and sort controls', () => {
    mockMatchMedia(true);
    renderGrid({
      columns: [{ ...columns[0], enableSorting: true }],
      renderMobileRow: (row) => <span>card {row.name}</span>,
      bulkActions: [{ value: 'email', label: 'Email' }],
      onBulkAction: jest.fn(),
    });

    expect(screen.getByText('common.table_grid.sort_default')).toBeInTheDocument();
    expect(screen.queryByText('common.table_grid.selected_count')).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('common.table_grid.select_all'));

    // The toolbar turns into the selection bar with the count.
    expect(screen.getByText('common.table_grid.selected_count')).toBeInTheDocument();
    expect(screen.getByText('common.table_grid.clear_selection')).toBeInTheDocument();
  });
});

describe('TableGrid cell stability', () => {
  it('keeps cell DOM and focus when the caller rebuilds its column definitions', () => {
    const makeColumns = (): ColumnDef<TestRow>[] => [
      { id: 'edit', header: 'Edit', cell: ({ row }) => <input aria-label={`edit ${row.original.name}`} defaultValue="" /> },
    ];
    const grid = (cols: ColumnDef<TestRow>[]) => (
      <TableGrid<TestRow>
        columns={cols}
        data={[{ id: 1, name: 'one' }]}
        enablePagination={false}
        error={undefined}
        loading={false}
        pageIndex={0}
        onPageChange={jest.fn()}
        refetchQueries={[]}
        searchFilter=""
        onSearchFilterChange={jest.fn()}
        showGlobalSearchField={false}
      />
    );
    const { rerender } = render(grid(makeColumns()));
    const input = screen.getByLabelText('edit one') as HTMLInputElement;
    input.focus();
    input.value = 'typed';

    // A refetch typically yields new column objects with new cell functions.
    rerender(grid(makeColumns()));

    const after = screen.getByLabelText('edit one') as HTMLInputElement;
    expect(after).toBe(input);
    expect(after.value).toBe('typed');
    expect(document.activeElement).toBe(after);
  });
});
