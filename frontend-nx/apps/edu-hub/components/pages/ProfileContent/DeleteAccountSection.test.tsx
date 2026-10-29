import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DeleteAccountSection from './DeleteAccountSection';

const mockDelete = jest.fn();
const mockLogout = jest.fn();
let mockImpersonating = false;
jest.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
jest.mock('../../../hooks/authedMutation', () => ({ useRoleMutation: () => [mockDelete] }));
jest.mock('../../../hooks/logout', () => ({ __esModule: true, default: () => mockLogout }));
jest.mock('../../../hooks/viewAs', () => ({ useViewAs: () => ({ asPlainUser: mockImpersonating }) }));
jest.mock('../../../hooks/useMediaQuery', () => ({ useMediaQuery: () => false }));

const openDialog = () => {
  render(<DeleteAccountSection email="person@example.com" />);
  fireEvent.click(screen.getByRole('button', { name: 'delete_button' }));
};
const confirmEmail = () => {
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'person@example.com' } });
};

beforeEach(() => {
  jest.clearAllMocks();
  mockImpersonating = false;
});

it('requires a matching email and an explicit confirmation before deleting', async () => {
  openDialog();
  expect(screen.getByRole('dialog')).toHaveTextContent('certificates_warning');
  expect(screen.getByRole('dialog')).toHaveTextContent('connected_services');
  const confirm = screen.getByRole('button', { name: 'confirm_button' });
  expect(confirm).toBeDisabled();
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'other@example.com' } });
  expect(confirm).toBeDisabled();
  expect(mockDelete).not.toHaveBeenCalled();
  mockDelete.mockResolvedValue({ data: { deleteMyAccount: { error: null, messageKey: 'ANONYMIZATION_SUCCESS' } } });
  confirmEmail();
  fireEvent.click(confirm);
  await waitFor(() => expect(mockLogout).toHaveBeenCalledTimes(1));
  expect(mockDelete).toHaveBeenCalledWith();
});

it('cancels without making a request and resets confirmation on reopening', async () => {
  openDialog();
  confirmEmail();
  fireEvent.click(screen.getByRole('button', { name: 'cancel' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  fireEvent.click(screen.getByRole('button', { name: 'delete_button' }));
  expect(screen.getByRole('button', { name: 'confirm_button' })).toBeDisabled();
  expect(mockDelete).not.toHaveBeenCalled();
});

it('keeps the session and displays a retryable error on partial failure', async () => {
  mockDelete.mockResolvedValue({ data: { deleteMyAccount: { error: 'ERROR_SOME_STEPS_FAILED' } } });
  openDialog();
  confirmEmail();
  fireEvent.click(screen.getByRole('button', { name: 'confirm_button' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('error');
  expect(mockLogout).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'confirm_button' })).toBeEnabled();
});

it('prevents duplicate submissions and closing during deletion', async () => {
  let resolveDelete: (value: unknown) => void;
  mockDelete.mockReturnValue(new Promise((resolve) => { resolveDelete = resolve; }));
  openDialog();
  confirmEmail();
  fireEvent.click(screen.getByRole('button', { name: 'confirm_button' }));
  fireEvent.click(screen.getByRole('button', { name: 'close' }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'deleting' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'cancel' })).toBeDisabled();
  expect(mockDelete).toHaveBeenCalledTimes(1);
  resolveDelete!({ data: { deleteMyAccount: { error: null, messageKey: 'ANONYMIZATION_SUCCESS' } } });
  await waitFor(() => expect(mockLogout).toHaveBeenCalledTimes(1));
});

it('hides deletion during impersonation', () => {
  mockImpersonating = true;
  render(<DeleteAccountSection email="person@example.com" />);
  expect(screen.queryByRole('button', { name: 'delete_button' })).not.toBeInTheDocument();
});
