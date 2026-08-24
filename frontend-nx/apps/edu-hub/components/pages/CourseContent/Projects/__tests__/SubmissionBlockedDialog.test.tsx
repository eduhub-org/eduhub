import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SubmissionBlockedDialog from '../SubmissionBlockedDialog';

// Keys are asserted directly — the wording lives in the locale files.
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}:${JSON.stringify(values)}` : key,
}));

const setup = (props: Partial<React.ComponentProps<typeof SubmissionBlockedDialog>> = {}) => {
  const onGoToField = jest.fn();
  const onClose = jest.fn();
  render(
    <SubmissionBlockedDialog
      open
      onClose={onClose}
      blockers={['coverImage']}
      onGoToField={onGoToField}
      {...props}
    />
  );
  return { onGoToField, onClose };
};

describe('SubmissionBlockedDialog', () => {
  it('names every blocker that keeps the project from being submitted', () => {
    setup({ blockers: ['documentation', 'coverImage'] });

    expect(screen.getByText('projects.submission_blocked.reason.documentation')).toBeInTheDocument();
    expect(screen.getByText('projects.submission_blocked.reason.coverImage')).toBeInTheDocument();
    expect(screen.getByText('projects.submission_blocked.body_main')).toBeInTheDocument();
  });

  it('offers a jump to the field of each fixable blocker', () => {
    const { onGoToField } = setup({ blockers: ['coverImage'] });

    fireEvent.click(
      screen.getByRole('button', { name: /projects.submission_blocked.go_to_field/ })
    );

    expect(onGoToField).toHaveBeenCalledWith('coverImage');
  });

  it('shows no field shortcut for blockers without a field', () => {
    setup({ blockers: ['authorsPending'] });

    expect(screen.getByText('projects.submission_blocked.reason.authorsPending')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /projects.submission_blocked.go_to_field/ })
    ).not.toBeInTheDocument();
  });

  it('explains a passed deadline with its date and offers no shortcuts', () => {
    setup({
      blockers: ['deadline', 'coverImage'],
      submissionDeadlineDisplay: '21.08.2026',
    });

    expect(screen.getByText('projects.submission_blocked.body_deadline')).toBeInTheDocument();
    expect(
      screen.getByText(
        'projects.submission_blocked.reason.deadline_with_date:{"date":"21.08.2026"}'
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /projects.submission_blocked.go_to_field/ })
    ).not.toBeInTheDocument();
  });
});
