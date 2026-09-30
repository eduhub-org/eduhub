import { FC } from 'react';
import { useTranslations } from 'next-intl';
import { ManagedCourseApplications_Course_by_pk } from '../../../../queries/__generated__/ManagedCourseApplications';
import { getRegistrationFeatures } from './registrationConfig';

/**
 * One cell of the statistics strip: the number first, so a row of them scans quickly, and its label
 * underneath. Phones show two per row (the labels are too long for three), an odd last cell
 * filling the row; from md up every cell shares a single row.
 */
const StatCard: FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="min-w-0 flex-1 basis-[40%] md:basis-0 bg-bg-card px-3 py-2 md:px-4">
    <div className="text-lg md:text-xl font-semibold tabular-nums text-label-primary">{value}</div>
    <div className="truncate text-xs text-label-secondary" title={label}>
      {label}
    </div>
  </div>
);

interface Props {
  course: ManagedCourseApplications_Course_by_pk;
  hasCourseStarted: boolean;
}

export const CourseEnrollmentStatistics: FC<Props> = ({ course, hasCourseStarted }) => {
  const t = useTranslations('manageCourse');
  const features = getRegistrationFeatures(course.registrationType);
  const applicationStats = {
    totalApplications: course.TotalCourseEnrollments.aggregate?.count ?? 0,
    rejectedApplications: course.RejectedCourseEnrollments.aggregate?.count ?? 0,
    expiredInvitations: course.ExpiredCourseEnrollments.aggregate?.count ?? 0,
    invitedApplicants: course.InvitedCourseEnrollments.aggregate?.count ?? 0,
    confirmedApplicants: course.ConfirmedCourseEnrollments.aggregate?.count ?? 0,
    cancelledApplicants: course.CancelledCourseEnrollments.aggregate?.count ?? 0,
    abortedParticipants: course.AbortedCourseEnrollments.aggregate?.count ?? 0,
    pendingRegistrations: course.PendingCourseEnrollments.aggregate?.count ?? 0,
    waitlistedRegistrations: course.WaitlistedCourseEnrollments.aggregate?.count ?? 0,
  };

  return (
    <>
      {/* Statistics strip: one compact framed row; the 1px gaps over the border colour draw the
          dividers between the cells. */}
      {applicationStats.totalApplications > 0 && (
        <div className="flex flex-wrap gap-px overflow-hidden rounded-lg border border-border-primary bg-border-primary mb-8">
          {features.hasApplicationProcess ? (
            <>
              {/* Approval-based Registration: Show application outcomes */}
              <StatCard label={t('statistics_applications_total')} value={applicationStats.totalApplications} />
              <StatCard label={t('statistics_invitations_total')} value={applicationStats.invitedApplicants} />
              <StatCard label={t('statistics_applications_rejected')} value={applicationStats.rejectedApplications} />
              <StatCard label={t('statistics_participation_confirmed')} value={applicationStats.confirmedApplicants} />
              <StatCard label={t(hasCourseStarted ? 'statistics_participation_aborted' : 'statistics_invitations_expired')} value={hasCourseStarted ? applicationStats.abortedParticipants : applicationStats.expiredInvitations} />
            </>
          ) : (
            <>
              <StatCard label={t('statistics_registrations_total')} value={applicationStats.totalApplications} />
              <StatCard label={t('statistics_registrations_confirmed')} value={applicationStats.confirmedApplicants} />
              <StatCard label={t('statistics_registrations_cancelled')} value={applicationStats.cancelledApplicants} />
              {applicationStats.pendingRegistrations > 0 && (
                <StatCard label={t('statistics_registrations_pending')} value={applicationStats.pendingRegistrations} />
              )}
              {applicationStats.waitlistedRegistrations > 0 && (
                <StatCard label={t('statistics_registrations_waitlisted')} value={applicationStats.waitlistedRegistrations} />
              )}
              {hasCourseStarted && (
                <StatCard label={t('statistics_participation_aborted')} value={applicationStats.abortedParticipants} />
              )}
            </>
          )}
        </div>
      )}

    </>
  );
};
