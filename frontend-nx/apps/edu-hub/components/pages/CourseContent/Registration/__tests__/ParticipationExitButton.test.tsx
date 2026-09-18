import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { CourseEnrollmentStatus_enum } from '../../../../../__generated__/globalTypes';
import { ParticipationExitButton } from '../ParticipationExitButton';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'de',
}));

const cancelOwnEnrollment = jest.fn();
jest.mock('../../../../../hooks/authedMutation', () => ({
  useRoleMutation: () => [(...args: unknown[]) => cancelOwnEnrollment(...args)],
}));

const session = (startDateTime: string, endDateTime: string) => ({
  startDateTime,
  endDateTime,
});

const enrollment = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 77,
    status: CourseEnrollmentStatus_enum.CONFIRMED,
    Invoices: [],
    ...overrides,
  } as any);

const renderButton = (props: Record<string, unknown> = {}) =>
  render(
    <ParticipationExitButton
      courseEnrollment={enrollment()}
      courseTitle="Test Course"
      sessions={[session('2026-03-10T10:00:00Z', '2026-03-10T12:00:00Z')] as any}
      {...(props as any)}
    />
  );

describe('ParticipationExitButton', () => {
  beforeEach(() => {
    cancelOwnEnrollment.mockReset().mockResolvedValue({ data: {} });
    jest.useFakeTimers({ doNotFake: ['setTimeout', 'queueMicrotask'] }).setSystemTime(
      new Date('2026-03-01T00:00:00Z')
    );
  });

  afterEach(() => jest.useRealTimers());

  const clickButton = (name: string) => fireEvent.click(screen.getByRole('button', { name }));

  it('offers cancelling before the course starts', () => {
    renderButton();
    expect(screen.getByRole('button', { name: 'registration.cancel_participation' })).toBeInTheDocument();
  });

  it('offers aborting once the course is running', () => {
    jest.setSystemTime(new Date('2026-03-10T11:00:00Z'));
    renderButton();
    expect(screen.getByRole('button', { name: 'registration.abort_participation' })).toBeInTheDocument();
  });

  it('renders nothing once the course is over', () => {
    jest.setSystemTime(new Date('2026-03-20T00:00:00Z'));
    const { container } = renderButton();
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing for a terminal enrollment status', () => {
    const { container } = renderButton({
      courseEnrollment: enrollment({ status: CourseEnrollmentStatus_enum.COMPLETED }),
    });
    expect(container).toBeEmptyDOMElement();
  });

  it('asks before it acts, and only then sends the status change', async () => {
    const onExit = jest.fn();
    renderButton({ onExit });

    clickButton('registration.cancel_participation');
    expect(cancelOwnEnrollment).not.toHaveBeenCalled();

    clickButton('confirm');

    await waitFor(() => expect(onExit).toHaveBeenCalledWith('CANCEL'));
    expect(cancelOwnEnrollment).toHaveBeenCalledWith({
      variables: { enrollmentId: 77, status: CourseEnrollmentStatus_enum.CANCELLED },
    });
  });

  it('sends ABORTED, not CANCELLED, once the course is running', async () => {
    jest.setSystemTime(new Date('2026-03-10T11:00:00Z'));
    renderButton();

    clickButton('registration.abort_participation');
    clickButton('confirm');

    await waitFor(() =>
      expect(cancelOwnEnrollment).toHaveBeenCalledWith({
        variables: { enrollmentId: 77, status: CourseEnrollmentStatus_enum.ABORTED },
      })
    );
  });

  it('reports a failed status change instead of leaving the page unchanged in silence', async () => {
    cancelOwnEnrollment.mockRejectedValue(new Error('nope'));
    const onExit = jest.fn();
    renderButton({ onExit });

    clickButton('registration.cancel_participation');
    clickButton('confirm');

    expect(await screen.findByText('errors.participation_exit_failed')).toBeInTheDocument();
    expect(onExit).not.toHaveBeenCalled();
  });
});
