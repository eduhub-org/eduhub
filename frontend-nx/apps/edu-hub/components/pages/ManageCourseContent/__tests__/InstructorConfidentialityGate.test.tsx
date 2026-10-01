import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Renders `key` or `key:{...values}` so tests can see what was interpolated.
const t = (key: string, values?: Record<string, string>) => (values ? `${key}:${JSON.stringify(values)}` : key);
jest.mock('next-intl', () => ({ useTranslations: () => t }));

const mockAppSettings = { operatorName: null as string | null, privacyContactEmail: null as string | null };
jest.mock('../../../../contexts/AppSettingsContext', () => ({ useAppSettings: () => mockAppSettings }));

jest.mock('../../../../hooks/user', () => ({ useUserId: () => 'user-1' }));

const mockUseRoleQuery = jest.fn();
jest.mock('../../../../hooks/authedQuery', () => ({
  useRoleQuery: (...args: unknown[]) => mockUseRoleQuery(...args),
}));

const accept = jest.fn();
jest.mock('../../../../hooks/authedMutation', () => ({
  useRoleMutation: () => [accept, { loading: false }],
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { InstructorConfidentialityGate } = require('../InstructorConfidentialityGate');

const accepted = { InstructorConfidentialityAcceptance: [{ id: 'a', created_at: '2026-09-30T00:00:00Z' }] };
const notAccepted = { InstructorConfidentialityAcceptance: [] };

describe('InstructorConfidentialityGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAppSettings.operatorName = null;
    mockAppSettings.privacyContactEmail = null;
  });

  it('renders the page once the commitment was accepted', () => {
    mockUseRoleQuery.mockReturnValue({ data: accepted, loading: false, refetch: jest.fn() });

    render(<InstructorConfidentialityGate>page content</InstructorConfidentialityGate>);

    expect(screen.getByText('page content')).toBeInTheDocument();
    expect(screen.queryByText('title')).not.toBeInTheDocument();
  });

  it('asks for the commitment and only enables the button after the checkbox', async () => {
    const refetch = jest.fn().mockResolvedValue({ data: accepted });
    mockUseRoleQuery.mockReturnValue({ data: notAccepted, loading: false, refetch });

    render(<InstructorConfidentialityGate>page content</InstructorConfidentialityGate>);

    expect(screen.queryByText('page content')).not.toBeInTheDocument();
    expect(screen.getByText(/^points\.no_disclosure/)).toBeInTheDocument();
    const button = screen.getByRole('button', { name: 'accept' });
    expect(button).toBeDisabled();

    fireEvent.click(screen.getByRole('checkbox'));
    expect(button).toBeEnabled();
    fireEvent.click(button);

    await waitFor(() => expect(refetch).toHaveBeenCalled());
    expect(accept).toHaveBeenCalledWith({ variables: { version: '2026-09' } });
  });

  it('treats a duplicate acceptance as success when the refetch finds it', async () => {
    accept.mockRejectedValueOnce(new Error('Uniqueness violation'));
    const refetch = jest.fn().mockResolvedValue({ data: accepted });
    mockUseRoleQuery.mockReturnValue({ data: notAccepted, loading: false, refetch });

    render(<InstructorConfidentialityGate>page content</InstructorConfidentialityGate>);
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'accept' }));

    await waitFor(() => expect(refetch).toHaveBeenCalled());
    expect(screen.queryByText('failed')).not.toBeInTheDocument();
  });

  it('reports a failure when the check after accepting fails', async () => {
    const refetch = jest.fn().mockRejectedValue(new Error('network down'));
    mockUseRoleQuery.mockReturnValue({ data: notAccepted, loading: false, refetch });

    render(<InstructorConfidentialityGate>page content</InstructorConfidentialityGate>);
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'accept' }));

    expect(await screen.findByText('failed')).toBeInTheDocument();
    expect(screen.queryByText('page content')).not.toBeInTheDocument();
  });

  it('names the configured operator and privacy contact', () => {
    mockAppSettings.operatorName = 'opencampus.sh';
    mockAppSettings.privacyContactEmail = 'datenschutz@example.org';
    mockUseRoleQuery.mockReturnValue({ data: notAccepted, loading: false, refetch: jest.fn() });

    render(<InstructorConfidentialityGate>page content</InstructorConfidentialityGate>);

    expect(screen.getByText(/^points\.purpose/).textContent).toContain('"operator":"opencampus.sh"');
    const incidents = screen.getByText(/^points\.incidents/).textContent;
    expect(incidents).toContain('recipient_contact');
    expect(incidents).toContain('datenschutz@example.org');
  });

  it('falls back to neutral wording without settings', () => {
    mockUseRoleQuery.mockReturnValue({ data: notAccepted, loading: false, refetch: jest.fn() });

    render(<InstructorConfidentialityGate>page content</InstructorConfidentialityGate>);

    expect(screen.getByText(/^points\.purpose/).textContent).toContain('"operator":"operator_generic"');
    expect(screen.getByText(/^points\.incidents/).textContent).toContain('"recipient":"recipient_generic"');
  });
});
