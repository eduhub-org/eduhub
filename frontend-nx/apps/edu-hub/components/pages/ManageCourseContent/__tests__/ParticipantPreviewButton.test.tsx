import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const t = (key: string) => key;
jest.mock('next-intl', () => ({ useTranslations: () => t }));

const push = jest.fn();
jest.mock('next/router', () => ({ useRouter: () => ({ push }) }));

jest.mock('../../../../hooks/user', () => ({ useUserId: () => 'user-1' }));

const mockUseRoleQuery = jest.fn();
jest.mock('../../../../hooks/authedQuery', () => ({
  useRoleQuery: (...args: unknown[]) => mockUseRoleQuery(...args),
}));

const createMutation = jest.fn();
const removeMutation = jest.fn();
jest.mock('../../../../hooks/authedMutation', () => ({
  useRoleMutation: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { useRoleMutation } = require('../../../../hooks/authedMutation');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ParticipantPreviewButton } = require('../ParticipantPreviewButton');

describe('ParticipantPreviewButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRoleMutation as jest.Mock)
      .mockReturnValueOnce([createMutation, { loading: false }])
      .mockReturnValueOnce([removeMutation, { loading: false }]);
  });

  it('offers to start the preview when there is no preview enrollment', () => {
    mockUseRoleQuery.mockReturnValue({ data: { CourseEnrollment: [] }, refetch: jest.fn() });

    render(<ParticipantPreviewButton courseId={1} />);

    expect(screen.getByText('start')).toBeInTheDocument();
    expect(screen.queryByText('end')).not.toBeInTheDocument();
  });

  it('offers to open and to end the preview once one exists', () => {
    mockUseRoleQuery.mockReturnValue({
      data: { CourseEnrollment: [{ id: 5, status: 'CONFIRMED', isTest: true }] },
      refetch: jest.fn(),
    });

    render(<ParticipantPreviewButton courseId={1} />);

    expect(screen.getByText('open')).toBeInTheDocument();
    expect(screen.getByText('end')).toBeInTheDocument();
    expect(screen.queryByText('start')).not.toBeInTheDocument();
  });
});
