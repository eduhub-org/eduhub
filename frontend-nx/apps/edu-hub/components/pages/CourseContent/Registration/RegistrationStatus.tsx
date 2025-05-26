import { FC } from 'react';
import useTranslation from 'next-translate/useTranslation';

import { CourseEnrollmentStatus_enum } from '../../../../__generated__/globalTypes';
import { Course_Course_by_pk } from '../../../../queries/__generated__/Course';
import { CourseWithEnrollment_Course_by_pk_CourseEnrollments } from '../../../../queries/__generated__/CourseWithEnrollment';
import { Button } from '../../../common/Button';

/**
 * Props for the RegistrationStatus component
 */
interface RegistrationStatusProps {
  /** The user's enrollment record for this course */
  courseEnrollment: CourseWithEnrollment_Course_by_pk_CourseEnrollments;
  /** Course data containing chat links and location information */
  course: Course_Course_by_pk;
}

/**
 * Component that displays course resource access buttons for confirmed/completed enrollments.
 * Shows direct links to course chat and online meeting when available.
 *
 * @param course - Course data containing chat and location information
 * @returns JSX element with course resource buttons
 */
const CourseLinkInfos: FC<{ course: Course_Course_by_pk }> = ({ course }) => {
  const { t } = useTranslation('course');

  const onlineLocation = course.CourseLocations?.find((location) => location.locationOption === 'ONLINE');

  return (
    <div className="flex flex-col justify-between items-center">
      <div className="mb-10">
        <Button className="bg-blue-200" as="a" href={course.chatLink} filled inverted>
          {t('general.to_course_chat')}
        </Button>
      </div>
      {onlineLocation && onlineLocation.defaultSessionAddress && (
        <div className="">
          <Button className="bg-blue-200" as="a" href={onlineLocation.defaultSessionAddress} filled inverted>
            {t('general.to_online_meeting')}
          </Button>
        </div>
      )}
    </div>
  );
};

/**
 * Registration status component that displays the current enrollment status and appropriate actions
 * for users who are already enrolled in a course.
 *
 * Handles all possible enrollment statuses from the database:
 * - APPLIED: "The course application was received" - Shows applied status badge
 * - REJECTED: "The application was rejected" - Shows rejected status badge
 * - INVITED: "Invitation was sent to Student" - Shows invited status with accept button (if not expired)
 * - CONFIRMED: "The course invitation was confirmed by the student" - Shows course resource buttons
 * - ABORTED: "The course was not successfully completed" - Shows aborted status badge
 * - COMPLETED: "The course was successfully completed by receiving at least one certificate" - Shows course resource buttons
 * - CANCELLED: "User has cancelled application" - Shows cancelled status badge
 *
 * Features:
 * - Automatic invitation expiration checking for INVITED status
 * - Course resource access (chat, online meeting) for CONFIRMED and COMPLETED statuses
 * - Responsive design for mobile and desktop
 * - Localized status messages and button text
 * - Integration with course chat (Mattermost) and video conferencing
 *
 * @param props - The component props
 * @returns JSX element representing the enrollment status and available actions
 */
export const RegistrationStatus: FC<RegistrationStatusProps> = ({ courseEnrollment, course }) => {
  const { t } = useTranslation('course');

  const status = courseEnrollment.status;

  switch (status) {
    case CourseEnrollmentStatus_enum.ABORTED: {
      return <span className="bg-gray-300 p-4">{t('status.aborted')}</span>;
    }
    case CourseEnrollmentStatus_enum.APPLIED: {
      return <span className="bg-gray-300 p-4">{t('status.applied')}</span>;
    }
    case CourseEnrollmentStatus_enum.REJECTED: {
      return <span className="bg-gray-300 p-4">{t('status.rejected')}</span>;
    }
    case CourseEnrollmentStatus_enum.CANCELLED: {
      return <span className="bg-gray-300 p-4">{t('status.cancelled')}</span>;
    }
    case CourseEnrollmentStatus_enum.INVITED: {
      if (
        courseEnrollment.invitationExpirationDate &&
        new Date(courseEnrollment.invitationExpirationDate).setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0)
      ) {
        return (
          <div className="flex flex-col sm:flex-row sm:items-center">
            <div className="bg-gray-300 p-4 mb-6 sm:mb-0 sm:w-2/3 sm:mr-5">{t('status.invited')}</div>
            <Button
              filled
              inverted
              onClick={() => {
                // This will be handled by the parent component
                console.log('Accept invitation clicked');
              }}
              className="bg-edu-course-current sm:w-1/3"
            >
              {t('registration.accept_invitation')}
            </Button>
          </div>
        );
      } else {
        return <span className="bg-gray-300 p-4">{t('status.invitation_expired')}</span>;
      }
    }
    case CourseEnrollmentStatus_enum.CONFIRMED: {
      return <CourseLinkInfos course={course} />;
    }
    case CourseEnrollmentStatus_enum.COMPLETED: {
      return <CourseLinkInfos course={course} />;
    }
    default: {
      return null;
    }
  }
};

export default RegistrationStatus;
