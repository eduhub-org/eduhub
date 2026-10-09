import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { FormbricksResponsesDisplay } from '../FormbricksResponsesDisplay';

const useRoleQuery = jest.fn();
jest.mock('../../../../../hooks/authedQuery', () => ({
  useRoleQuery: (...args: unknown[]) => useRoleQuery(...args),
}));
jest.mock('../../../../../queries/formbricks', () => ({ GET_FORMBRICKS_RESPONSES: 'GET_FORMBRICKS_RESPONSES' }));
jest.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));

const stored = (finished: boolean, answer = 'stored answer') => ({
  provider: 'formbricks',
  formatVersion: 1,
  survey: { id: 's', name: 'Stored Survey', url: 'https://forms.example/s/s' },
  response: {
    id: 'r1',
    finished,
    answers: [{ questionId: 'q1', questionType: 'openText', headline: 'Why?', answer }],
  },
});

const props = { courseId: 1, userId: 'u', enrollmentId: 7, formbricksEnrollmentSurveyUrl: 'https://forms.example/s/s' };

const queryOptions = () => useRoleQuery.mock.calls[useRoleQuery.mock.calls.length - 1][1];

describe('FormbricksResponsesDisplay', () => {
  beforeEach(() => useRoleQuery.mockReset());

  it('shows a finished stored response without asking Formbricks', () => {
    useRoleQuery.mockReturnValue({ data: undefined, loading: false, error: undefined });
    render(<FormbricksResponsesDisplay {...props} storedResponse={stored(true)} />);
    expect(queryOptions().skip).toBe(true);
    expect(screen.getByText('stored answer')).toBeInTheDocument();
    expect(screen.getByText('(Stored Survey)')).toBeInTheDocument();
  });

  it('fetches when nothing is stored', () => {
    useRoleQuery.mockReturnValue({
      data: {
        getFormbricksResponses: {
          success: true,
          survey: { name: 'Live' },
          responses: [{ id: 'r', finished: true, answers: [{ questionId: 'q', headline: 'H', answer: 'live answer' }] }],
        },
      },
      loading: false,
      error: undefined,
    });
    render(<FormbricksResponsesDisplay {...props} storedResponse={null} />);
    expect(queryOptions().skip).toBe(false);
    expect(screen.getByText('live answer')).toBeInTheDocument();
  });

  it('refetches an unfinished stored response and falls back to it when Formbricks fails', () => {
    useRoleQuery.mockReturnValue({ data: undefined, loading: false, error: new Error('down') });
    render(<FormbricksResponsesDisplay {...props} storedResponse={stored(false, 'partial')} />);
    expect(queryOptions().skip).toBe(false);
    expect(screen.getByText('partial')).toBeInTheDocument();
    expect(screen.getByText('formbricks.incomplete_response')).toBeInTheDocument();
  });

  it('ignores JSON of another provider', () => {
    useRoleQuery.mockReturnValue({ data: undefined, loading: true, error: undefined });
    render(<FormbricksResponsesDisplay {...props} storedResponse={{ ...stored(true), provider: 'other' }} />);
    expect(queryOptions().skip).toBe(false);
    expect(screen.getByText('formbricks.loading_responses')).toBeInTheDocument();
  });
});
