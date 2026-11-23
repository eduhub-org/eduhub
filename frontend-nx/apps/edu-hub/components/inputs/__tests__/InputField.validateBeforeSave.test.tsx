import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { gql } from '@apollo/client';

import InputField from '../InputField';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// react-markdown/remark-gfm ship as ESM and are not what this test exercises.
jest.mock('react-markdown', () => ({ __esModule: true, default: () => null }));
jest.mock('remark-gfm', () => ({ __esModule: true, default: () => undefined }));
jest.mock('../../common/InlineMarkdown', () => ({ __esModule: true, default: () => null }));

const mockMutate = jest.fn();
jest.mock('../../../hooks/authedMutation', () => ({
  useRoleMutation: () => [mockMutate],
}));

const UPDATE = gql`
  mutation UpdateTitle($itemId: Int!, $text: String!) {
    update_Course_by_pk(pk_columns: { id: $itemId }, _set: { title: $text }) {
      id
    }
  }
`;

const renderField = (validateBeforeSave: (text: string) => Promise<string | null>) =>
  render(
    <InputField
      variant="material"
      type="input"
      itemId={7}
      value="Alt"
      updateValueMutation={UPDATE}
      validateBeforeSave={validateBeforeSave}
      debounceTimeout={10}
      showCharacterCount={false}
    />
  );

const typeAndSettle = async (text: string) => {
  fireEvent.change(screen.getByRole('textbox'), { target: { value: text } });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
};

describe('InputField validateBeforeSave', () => {
  beforeEach(() => mockMutate.mockReset());

  it('shows the message and does not save when the check fails', async () => {
    renderField(async () => 'Titel ist schon vergeben');
    await typeAndSettle('Vergeben');
    expect(mockMutate).not.toHaveBeenCalled();
    expect(screen.getByText('Titel ist schon vergeben')).toBeInTheDocument();
  });

  it('saves when the check passes', async () => {
    const check = jest.fn(async () => null);
    renderField(check);
    await typeAndSettle('Frei');
    expect(check).toHaveBeenCalledWith('Frei');
    expect(mockMutate).toHaveBeenCalledWith({ variables: { itemId: 7, text: 'Frei' } });
  });

  it('saves anyway when the check itself fails', async () => {
    renderField(async () => {
      throw new Error('network');
    });
    await typeAndSettle('Frei');
    expect(mockMutate).toHaveBeenCalledWith({ variables: { itemId: 7, text: 'Frei' } });
  });
});
