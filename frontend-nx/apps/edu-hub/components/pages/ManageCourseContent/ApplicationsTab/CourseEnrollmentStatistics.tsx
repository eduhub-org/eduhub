import { FC } from 'react';
import { useTranslations } from 'next-intl';
import { ManagedCourseApplications_Course_by_pk } from '../../../../queries/__generated__/ManagedCourseApplications';
import { getRegistrationFeatures } from './registrationConfig';

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
      {/* Statistics Cards */}
      {applicationStats.totalApplications > 0 && (
        <div className={`grid grid-cols-1 md:grid-cols-2 ${features.hasApplicationProcess ? 'lg:grid-cols-5' : 'lg:grid-cols-3'} gap-4 mb-6`}>
          {features.hasApplicationProcess ? (
            <>
              {/* Approval-based Registration: Show application outcomes */}
              <div className="bg-bg-secondary text-label-primary light p-4 rounded-lg">
                <div className="text-label-secondary text-sm mb-1">{t('statistics_applications_total')}</div>
                <div className="text-label-primary text-2xl font-semibold">{applicationStats.totalApplications}</div>
              </div>
              <div className="bg-bg-secondary text-label-primary light p-4 rounded-lg">
                <div className="text-label-secondary text-sm mb-1">{t('statistics_invitations_total')}</div>
                <div className="text-label-primary text-2xl font-semibold">{applicationStats.invitedApplicants}</div>
              </div>
              <div className="bg-bg-secondary text-label-primary light p-4 rounded-lg">
                <div className="text-label-secondary text-sm mb-1">{t('statistics_applications_rejected')}</div>
                <div className="text-label-primary text-2xl font-semibold">{applicationStats.rejectedApplications}</div>
              </div>
              <div className="bg-bg-secondary text-label-primary light p-4 rounded-lg">
                <div className="text-label-secondary text-sm mb-1">{t('statistics_participation_confirmed')}</div>
                <div className="text-label-primary text-2xl font-semibold">{applicationStats.confirmedApplicants}</div>
              </div>
              <div className="bg-bg-secondary text-label-primary light p-4 rounded-lg">
                <div className="text-label-secondary text-sm mb-1">{t(hasCourseStarted ? 'statistics_participation_aborted' : 'statistics_invitations_expired')}</div>
                <div className="text-label-primary text-2xl font-semibold">{hasCourseStarted ? applicationStats.abortedParticipants : applicationStats.expiredInvitations}</div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-bg-secondary text-label-primary light p-4 rounded-lg">
                <div className="text-label-secondary text-sm mb-1">{t('statistics_registrations_total')}</div>
                <div className="text-label-primary text-2xl font-semibold">{applicationStats.totalApplications}</div>
              </div>
              <div className="bg-bg-secondary text-label-primary light p-4 rounded-lg">
                <div className="text-label-secondary text-sm mb-1">{t('statistics_registrations_confirmed')}</div>
                <div className="text-label-primary text-2xl font-semibold">{applicationStats.confirmedApplicants}</div>
              </div>
              <div className="bg-bg-secondary text-label-primary light p-4 rounded-lg">
                <div className="text-label-secondary text-sm mb-1">{t('statistics_registrations_cancelled')}</div>
                <div className="text-label-primary text-2xl font-semibold">{applicationStats.cancelledApplicants}</div>
              </div>
              {applicationStats.pendingRegistrations > 0 && (
                <div className="bg-bg-secondary text-label-primary light p-4 rounded-lg">
                  <div className="text-label-secondary text-sm mb-1">{t('statistics_registrations_pending')}</div>
                  <div className="text-label-primary text-2xl font-semibold">{applicationStats.pendingRegistrations}</div>
                </div>
              )}
              {applicationStats.waitlistedRegistrations > 0 && (
                <div className="bg-bg-secondary text-label-primary light p-4 rounded-lg">
                  <div className="text-label-secondary text-sm mb-1">{t('statistics_registrations_waitlisted')}</div>
                  <div className="text-label-primary text-2xl font-semibold">{applicationStats.waitlistedRegistrations}</div>
                </div>
              )}
              {hasCourseStarted && (
                <div className="bg-bg-secondary text-label-primary light p-4 rounded-lg">
                  <div className="text-label-secondary text-sm mb-1">{t('statistics_participation_aborted')}</div>
                  <div className="text-label-primary text-2xl font-semibold">{applicationStats.abortedParticipants}</div>
                </div>
              )}
            </>
          )}
        </div>
      )}

    </>
  );
};
