import { render, screen } from '@testing-library/react';
import { CourseEnrollmentStatistics } from '../CourseEnrollmentStatistics';
import { CourseRegistrationType_enum } from '../../../../../__generated__/globalTypes';
import { ManagedCourseApplications_Course_by_pk } from '../../../../../queries/__generated__/ManagedCourseApplications';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

const count = (value: number) => ({
  __typename: 'CourseEnrollment_aggregate' as const,
  aggregate: { __typename: 'CourseEnrollment_aggregate_fields' as const, count: value },
});
const course = (registrationType: CourseRegistrationType_enum | null) =>
  ({
    registrationType,
    CourseEnrollments: [], // A table search with no matches must not hide course totals.
    TotalCourseEnrollments: count(20),
    InvitedCourseEnrollments: count(15),
    RejectedCourseEnrollments: count(3),
    ConfirmedCourseEnrollments: count(10),
    ExpiredCourseEnrollments: count(2),
    AbortedCourseEnrollments: count(4),
    CancelledCourseEnrollments: count(1),
    PendingCourseEnrollments: count(2),
    WaitlistedCourseEnrollments: count(3),
  } as unknown as ManagedCourseApplications_Course_by_pk);

const displayedCount = (key: string) => screen.getByText(key).nextElementSibling?.textContent;

describe('approval statistics', () => {
  it.each([CourseRegistrationType_enum.APPROVAL_WITH_INPUT, null])(
    'keeps rejected applications third and shows expired invitations before the start (%s)',
    (type) => {
      render(<CourseEnrollmentStatistics course={course(type)} hasCourseStarted={false} />);
      const labels = Array.from(document.querySelectorAll('.text-label-secondary')).map((el) => el.textContent);
      expect(labels).toEqual([
        'statistics_applications_total',
        'statistics_invitations_total',
        'statistics_applications_rejected',
        'statistics_participation_confirmed',
        'statistics_invitations_expired',
      ]);
      expect(displayedCount('statistics_invitations_expired')).toBe('2');
      expect(screen.queryByText('statistics_participation_aborted')).toBeNull();
    }
  );

  it('replaces the last card with the aborted count after the start', () => {
    const data = course(CourseRegistrationType_enum.APPROVAL_WITH_INPUT);
    const { rerender } = render(<CourseEnrollmentStatistics course={data} hasCourseStarted={false} />);
    rerender(<CourseEnrollmentStatistics course={data} hasCourseStarted />);
    expect(screen.queryByText('statistics_invitations_expired')).toBeNull();
    expect(displayedCount('statistics_participation_aborted')).toBe('4');
    expect(displayedCount('statistics_participation_confirmed')).toBe('10');
  });
});

describe.each([
  CourseRegistrationType_enum.DIRECT_CONFIRMATION,
  CourseRegistrationType_enum.DIRECT_WITH_INPUT,
  CourseRegistrationType_enum.DIRECT_CONFIRMATION_AND_PAYMENT,
  CourseRegistrationType_enum.DIRECT_WITH_INPUT_AND_PAYMENT,
])('direct registration statistics (%s)', (type) => {
  it('shows totals, confirmations, cancellations, pending registrations and waitlist before the start', () => {
    render(<CourseEnrollmentStatistics course={course(type)} hasCourseStarted={false} />);
    expect(displayedCount('statistics_registrations_total')).toBe('20');
    expect(displayedCount('statistics_registrations_confirmed')).toBe('10');
    expect(displayedCount('statistics_registrations_cancelled')).toBe('1');
    expect(displayedCount('statistics_registrations_pending')).toBe('2');
    expect(displayedCount('statistics_registrations_waitlisted')).toBe('3');
    expect(screen.queryByText('statistics_applications_rejected')).toBeNull();
    expect(screen.queryByText('statistics_invitations_expired')).toBeNull();
    expect(screen.queryByText('statistics_participation_aborted')).toBeNull();
  });

  it('reports aborted participation separately from cancellations after the start', () => {
    render(<CourseEnrollmentStatistics course={course(type)} hasCourseStarted />);
    expect(displayedCount('statistics_registrations_cancelled')).toBe('1');
    expect(displayedCount('statistics_participation_aborted')).toBe('4');
  });

  it('hides empty pending and waitlist cards', () => {
    const data = course(type);
    data.PendingCourseEnrollments = count(0);
    data.WaitlistedCourseEnrollments = count(0);
    render(<CourseEnrollmentStatistics course={data} hasCourseStarted={false} />);
    expect(screen.queryByText('statistics_registrations_pending')).toBeNull();
    expect(screen.queryByText('statistics_registrations_waitlisted')).toBeNull();
    expect(displayedCount('statistics_registrations_total')).toBe('20');
  });
});
