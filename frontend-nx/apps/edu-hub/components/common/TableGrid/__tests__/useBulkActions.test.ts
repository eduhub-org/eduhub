import { act, renderHook } from '@testing-library/react';

import { useBulkActions, useDeferredBulkAction } from '../hooks';

interface TestRow {
  id: number;
}

const rows: TestRow[] = [{ id: 1 }, { id: 2 }];

const selectAllRows = (result: { current: ReturnType<typeof useBulkActions<TestRow>> }) => {
  act(() => {
    result.current.toggleRowSelection(1);
    result.current.toggleRowSelection(2);
  });
};

describe('useBulkActions selection handling', () => {
  it('clears the selection once the action succeeded', async () => {
    const onBulkAction = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useBulkActions<TestRow>([], onBulkAction));

    selectAllRows(result);
    expect(result.current.selectedRowIds.size).toBe(2);

    await act(async () => {
      await result.current.handleBulkActionChange('publish', rows);
    });

    expect(onBulkAction).toHaveBeenCalledWith('publish', rows);
    expect(result.current.selectedRowIds.size).toBe(0);
    expect(result.current.bulkAction).toBe('');
  });

  it('keeps the selection when the action fails', async () => {
    const onBulkAction = jest.fn().mockRejectedValue(new Error('mutation failed'));
    const { result } = renderHook(() => useBulkActions<TestRow>([], onBulkAction));

    selectAllRows(result);

    await act(async () => {
      await result.current.handleBulkActionChange('publish', rows);
    });

    expect(result.current.selectedRowIds).toEqual(new Set([1, 2]));
    // The dropdown still returns to its placeholder so the action can be picked again.
    expect(result.current.bulkAction).toBe('');
  });

  it('keeps the selection when the action reports that it did nothing', async () => {
    const onBulkAction = jest.fn().mockReturnValue(false);
    const { result } = renderHook(() => useBulkActions<TestRow>([], onBulkAction));

    selectAllRows(result);

    await act(async () => {
      await result.current.handleBulkActionChange('publish', rows);
    });

    expect(result.current.selectedRowIds).toEqual(new Set([1, 2]));
  });

  it('keeps a row that was selected while the action was running', async () => {
    let finishAction: () => void = () => undefined;
    const onBulkAction = jest.fn(
      () => new Promise<void>((resolve) => {
        finishAction = resolve;
      })
    );
    const { result } = renderHook(() => useBulkActions<TestRow>([], onBulkAction));

    act(() => {
      result.current.toggleRowSelection(1);
    });

    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.handleBulkActionChange('publish', rows);
    });

    act(() => {
      result.current.toggleRowSelection(2);
    });

    await act(async () => {
      finishAction();
      await pending;
    });

    expect(onBulkAction).toHaveBeenCalledWith('publish', [{ id: 1 }]);
    expect(result.current.selectedRowIds).toEqual(new Set([2]));
  });

  it('ignores a second action while the first one is still running', async () => {
    let finishAction: () => void = () => undefined;
    const onBulkAction = jest.fn(
      () => new Promise<void>((resolve) => {
        finishAction = resolve;
      })
    );
    const { result } = renderHook(() => useBulkActions<TestRow>([], onBulkAction));

    selectAllRows(result);

    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.handleBulkActionChange('publish', rows);
    });
    expect(result.current.isBulkActionPending).toBe(true);

    await act(async () => {
      await result.current.handleBulkActionChange('unpublish', rows);
    });
    expect(onBulkAction).toHaveBeenCalledTimes(1);

    await act(async () => {
      finishAction();
      await pending;
    });
    expect(result.current.isBulkActionPending).toBe(false);
  });

  it('only passes the selected rows to the action', async () => {
    const onBulkAction = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useBulkActions<TestRow>([], onBulkAction));

    act(() => {
      result.current.toggleRowSelection(2);
    });

    await act(async () => {
      await result.current.handleBulkActionChange('publish', rows);
    });

    expect(onBulkAction).toHaveBeenCalledWith('publish', [{ id: 2 }]);
  });
});

describe('useDeferredBulkAction', () => {
  it('resolves the pending action on success and rejects it on failure', async () => {
    const { result } = renderHook(() => useDeferredBulkAction());

    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.start();
    });
    act(() => {
      result.current.succeed();
    });
    await expect(pending).resolves.toBeUndefined();

    act(() => {
      pending = result.current.start();
    });
    act(() => {
      result.current.fail();
    });
    await expect(pending).rejects.toThrow('Bulk action was not completed');
  });

  it('keeps the selection of an action that is superseded by a new one', async () => {
    const { result } = renderHook(() => useDeferredBulkAction());

    let superseded: Promise<void> = Promise.resolve();
    let current: Promise<void> = Promise.resolve();
    act(() => {
      superseded = result.current.start();
      current = result.current.start();
    });

    await expect(superseded).rejects.toThrow('Bulk action was not completed');

    act(() => {
      result.current.succeed();
    });
    await expect(current).resolves.toBeUndefined();
  });
});
