import { act, renderHook } from '@testing-library/react';

import { useTableGrid } from '../hooks';

// A stable client and observable, like Apollo's useQuery returns across renders.
const client = { query: jest.fn().mockResolvedValue({ data: { rows: [] } }) };
const observable = { options: { context: { role: 'org_admin' } } };
const query = {} as never;
const queryHook = jest.fn(() => ({ data: undefined, loading: false, error: undefined, client, observable }));

const renderTableGrid = () =>
  renderHook(() =>
    useTableGrid({
      queryHook,
      query,
      queryVariables: { courseId: 1 },
      pageSize: 20,
      debounceMs: 0,
      refetchFilter: (search: string) => ({ filter: search ? { name: { _ilike: `%${search}%` } } : {} }),
    })
  );

describe('useTableGrid fetchAllRows', () => {
  beforeEach(() => client.query.mockClear());

  it('stays the same function across pages, so TableGrid does not treat paging as a new query', () => {
    const { result } = renderTableGrid();
    const before = result.current.fetchAllRows;

    act(() => result.current.setPageIndex(3));

    expect(result.current.fetchAllRows).toBe(before);
  });

  it('changes with the search', async () => {
    jest.useFakeTimers();
    const { result } = renderTableGrid();
    const before = result.current.fetchAllRows;

    act(() => result.current.setSearchFilter('ada'));
    await act(async () => {
      jest.runAllTimers();
    });

    expect(result.current.fetchAllRows).not.toBe(before);
    jest.useRealTimers();
  });

  it('loads from the first row with the given limit, under the role of the table query', async () => {
    const { result } = renderTableGrid();
    act(() => result.current.setPageIndex(2));

    await act(async () => {
      await result.current.fetchAllRows(500);
    });

    expect(client.query).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({ courseId: 1, offset: 0, limit: 500 }),
        context: { role: 'org_admin' },
        fetchPolicy: 'no-cache',
      })
    );
  });
});
