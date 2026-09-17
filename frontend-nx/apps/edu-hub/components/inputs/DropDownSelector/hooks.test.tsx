import { act, renderHook } from '@testing-library/react';
import type { DocumentNode } from 'graphql';
import type { SelectChangeEvent } from '@mui/material';

import { useRoleMutation } from '../../../hooks/authedMutation';
import { useDropDownLogic } from './hooks';

jest.mock('../../../hooks/authedMutation', () => ({
  useRoleMutation: jest.fn(),
}));

const mockedUseRoleMutation = jest.mocked(useRoleMutation);
const updateValue = jest.fn();
const mutation = {} as DocumentNode;
const options: unknown[] = [];
const refetchQueries: unknown[] = [];
const reportValue = (value: string) => value;

const renderDropDownLogic = (nullable: boolean) =>
  renderHook(() =>
    useDropDownLogic('1', options, mutation, {}, reportValue, refetchQueries, nullable)
  );

describe('useDropDownLogic', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    updateValue.mockReset();
    mockedUseRoleMutation.mockReturnValue(
      [updateValue] as unknown as ReturnType<typeof useRoleMutation>
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('converts an empty UI value to null for a nullable mutation', () => {
    const { result } = renderDropDownLogic(true);

    act(() => {
      result.current.handleValueChange({ target: { value: '' } } as SelectChangeEvent<string>);
      jest.advanceTimersByTime(300);
    });

    expect(updateValue).toHaveBeenCalledWith({ variables: { value: null } });
  });

  it('does not run a non-nullable mutation with an empty value', () => {
    const { result } = renderDropDownLogic(false);

    act(() => {
      result.current.handleValueChange({ target: { value: '' } } as SelectChangeEvent<string>);
      jest.advanceTimersByTime(300);
    });

    expect(updateValue).not.toHaveBeenCalled();
    expect(result.current.errorMessage).toBe('unified_dropdown_selector.invalid_selection');
  });
});
