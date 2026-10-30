import { act, renderHook } from '@testing-library/react';

import { usePersistedPageSize } from '../hooks';

describe('usePersistedPageSize', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('uses the default size when nothing is stored', () => {
    const { result } = renderHook(() => usePersistedPageSize('users', 20));
    expect(result.current[0]).toBe(20);
  });

  it('restores the size the user last picked for the same table', () => {
    const first = renderHook(() => usePersistedPageSize('users', 20));
    act(() => first.result.current[1](50));
    expect(first.result.current[0]).toBe(50);
    first.unmount();

    const again = renderHook(() => usePersistedPageSize('users', 20));
    expect(again.result.current[0]).toBe(50);

    const otherTable = renderHook(() => usePersistedPageSize('experts', 20));
    expect(otherTable.result.current[0]).toBe(20);
  });

  it('ignores invalid stored values', () => {
    window.localStorage.setItem('eduhub.tableGrid.pageSize.users', 'abc');
    const { result } = renderHook(() => usePersistedPageSize('users', 20));
    expect(result.current[0]).toBe(20);
  });
});
