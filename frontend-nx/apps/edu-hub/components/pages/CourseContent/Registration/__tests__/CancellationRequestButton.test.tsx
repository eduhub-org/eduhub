import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { CourseEnrollmentStatus_enum, InvoiceStatus_enum } from '../../../../../__generated__/globalTypes';
import { CancellationRequestButton } from '../CancellationRequestButton';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, string>) =>
    values ? `${key} ${JSON.stringify(values)}` : key,
  useLocale: () => 'de',
}));

jest.mock('../../../../../helpers/dateTimeHelpers', () => ({
  useDisplayDate: () => (date: string) => `date(${date})`,
}));

// The reason field is a plain textarea here; InputField's debounce and server
// modes are not what this test is about.
jest.mock('../../../../inputs/InputField', () => ({
  __esModule: true,
  default: ({ label, onValueUpdated }: { label: string; onValueUpdated: (data: { text: string }) => void }) => (
    <textarea aria-label={label} onChange={(event) => onValueUpdated({ text: event.target.value })} />
  ),
}));

const requestCancellation = jest.fn();
jest.mock('../../../../../hooks/authedMutation', () => ({
  useRoleMutation: () => [(...args: unknown[]) => requestCancellation(...args)],
}));

const PAID = [{ status: InvoiceStatus_enum.PAID }];

const enrollment = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 77,
    status: CourseEnrollmentStatus_enum.CONFIRMED,
    Invoices: PAID,
    cancellationRequestedAt: null,
    ...overrides,
  }) as any;

const renderButton = (props: Record<string, unknown> = {}) =>
  render(
    <CancellationRequestButton
      courseEnrollment={enrollment()}
      sessions={[{ startDateTime: '2026-03-10T10:00:00Z', endDateTime: '2026-03-10T12:00:00Z' }] as any}
      {...(props as any)}
    />
  );

describe('CancellationRequestButton', () => {
  beforeEach(() => {
    requestCancellation.mockReset().mockResolvedValue({ data: { update_CourseEnrollment: { affected_rows: 1 } } });
    jest.useFakeTimers({ doNotFake: ['setTimeout', 'queueMicrotask'] }).setSystemTime(new Date('2026-03-01T00:00:00Z'));
  });

  afterEach(() => jest.useRealTimers());

  it('renders nothing for an unpaid enrollment - that one is cancelled directly', () => {
    const { container } = renderButton({ courseEnrollment: enrollment({ Invoices: [] }) });
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing once the course is over', () => {
    jest.setSystemTime(new Date('2026-03-20T00:00:00Z'));
    const { container } = renderButton();
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the open request instead of offering it again', () => {
    renderButton({ courseEnrollment: enrollment({ cancellationRequestedAt: '2026-02-28T09:00:00Z' }) });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(
      screen.getByText('CancellationRequest.requested_notice {"date":"date(2026-02-28T09:00:00Z)"}')
    ).toBeInTheDocument();
  });

  it('says nothing about a request once the enrollment has been cancelled', () => {
    const { container } = renderButton({
      courseEnrollment: enrollment({
        status: CourseEnrollmentStatus_enum.CANCELLED,
        cancellationRequestedAt: '2026-02-28T09:00:00Z',
      }),
    });
    expect(container).toBeEmptyDOMElement();
  });

  it('asks first, then sends the request with the reason', async () => {
    const onRequested = jest.fn();
    renderButton({ onRequested });

    fireEvent.click(screen.getByRole('button', { name: 'CancellationRequest.request_cancellation' }));
    expect(requestCancellation).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('CancellationRequest.reason_label'), {
      target: { value: '  Ich bin krank  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'CancellationRequest.send_request' }));

    await waitFor(() => expect(onRequested).toHaveBeenCalledWith(true));
    expect(requestCancellation).toHaveBeenCalledWith({
      variables: { enrollmentId: 77, requestedAt: expect.any(String), reason: 'Ich bin krank' },
    });
  });

  it('sends no reason when none was given', async () => {
    renderButton();

    fireEvent.click(screen.getByRole('button', { name: 'CancellationRequest.request_cancellation' }));
    fireEvent.click(screen.getByRole('button', { name: 'CancellationRequest.send_request' }));

    await waitFor(() =>
      expect(requestCancellation).toHaveBeenCalledWith({
        variables: { enrollmentId: 77, requestedAt: expect.any(String), reason: null },
      })
    );
  });

  it('reports a failed request', async () => {
    requestCancellation.mockRejectedValue(new Error('nope'));
    const onRequested = jest.fn();
    renderButton({ onRequested });

    fireEvent.click(screen.getByRole('button', { name: 'CancellationRequest.request_cancellation' }));
    fireEvent.click(screen.getByRole('button', { name: 'CancellationRequest.send_request' }));

    expect(await screen.findByText('CancellationRequest.request_failed')).toBeInTheDocument();
    expect(onRequested).not.toHaveBeenCalled();
  });
});
