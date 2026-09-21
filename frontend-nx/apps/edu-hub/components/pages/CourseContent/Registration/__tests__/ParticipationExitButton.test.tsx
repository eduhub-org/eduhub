import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { CourseEnrollmentStatus_enum, InvoiceStatus_enum } from '../../../../../__generated__/globalTypes';
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
    cancelOwnEnrollment
      .mockReset()
      .mockResolvedValue({ data: { update_CourseEnrollment: { affected_rows: 1 } } });
    jest.useFakeTimers({ doNotFake: ['setTimeout', 'queueMicrotask'] }).setSystemTime(
      new Date('2026-03-01T00:00:00Z')
    );
  });

  afterEach(() => jest.useRealTimers());

  const clickButton = (name: string) => fireEvent.click(screen.getByRole('button', { name }));

  it('offers cancelling before the course starts', () => {
    renderButton();
    expect(
      screen.getByRole('button', { name: 'ParticipationExitButton.cancel_participation' })
    ).toBeInTheDocument();
  });

  it('offers aborting once the course is running', () => {
    jest.setSystemTime(new Date('2026-03-10T11:00:00Z'));
    renderButton();
    expect(
      screen.getByRole('button', { name: 'ParticipationExitButton.abort_participation' })
    ).toBeInTheDocument();
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

  it('renders nothing when any invoice was paid, even behind a newer one', () => {
    const { container } = renderButton({
      courseEnrollment: enrollment({
        Invoices: [{ status: InvoiceStatus_enum.ISSUED }, { status: InvoiceStatus_enum.PAID }],
      }),
    });
    expect(container).toBeEmptyDOMElement();
  });

  it('reports no success when the enrollment had already moved on', async () => {
    cancelOwnEnrollment.mockResolvedValue({ data: { update_CourseEnrollment: { affected_rows: 0 } } });
    const onExit = jest.fn();
    renderButton({ onExit });

    clickButton('ParticipationExitButton.cancel_participation');
    clickButton('confirm');

    // The caller still refetches - that is how the participant finds out where
    // the enrollment actually stands - but it must not claim a cancellation.
    await waitFor(() => expect(onExit).toHaveBeenCalledWith({ kind: 'CANCEL', changed: false }));
  });

  it('asks before it acts, and only then sends the status change', async () => {
    const onExit = jest.fn();
    renderButton({ onExit });

    clickButton('ParticipationExitButton.cancel_participation');
    expect(cancelOwnEnrollment).not.toHaveBeenCalled();

    clickButton('confirm');

    await waitFor(() => expect(onExit).toHaveBeenCalledWith({ kind: 'CANCEL', changed: true }));
    expect(cancelOwnEnrollment).toHaveBeenCalledWith({
      variables: { enrollmentId: 77, status: CourseEnrollmentStatus_enum.CANCELLED },
    });
  });

  it('sends ABORTED, not CANCELLED, once the course is running', async () => {
    jest.setSystemTime(new Date('2026-03-10T11:00:00Z'));
    renderButton();

    clickButton('ParticipationExitButton.abort_participation');
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

    clickButton('ParticipationExitButton.cancel_participation');
    clickButton('confirm');

    expect(await screen.findByText('ParticipationExitButton.exit_failed')).toBeInTheDocument();
    expect(onExit).not.toHaveBeenCalled();
  });
});
