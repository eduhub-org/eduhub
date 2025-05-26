import { FC } from 'react';
import useTranslation from 'next-translate/useTranslation';
import { MdCheckCircle, MdHourglassEmpty, MdCancel, MdError, MdMailOutline, MdAccessTime } from 'react-icons/md';

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
 * Status card component for displaying enrollment status with appropriate styling and icons
 */
const StatusCard: FC<{
  status: 'success' | 'pending' | 'warning' | 'error' | 'info';
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ status, icon, children }) => {
  const statusStyles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    pending: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-gray-50 border-gray-200 text-gray-800',
  };

  return (
    <div className={`rounded-lg border-2 p-4 w-full ${statusStyles[status]} flex items-center space-x-3`}>
      <div className="flex-shrink-0 text-xl">{icon}</div>
      <div className="font-medium">{children}</div>
    </div>
  );
};

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
    <div className="flex flex-col justify-between items-center w-full">
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
      return (
        <StatusCard status="error" icon={<MdError />}>
          {t('status.aborted')}
        </StatusCard>
      );
    }
    case CourseEnrollmentStatus_enum.APPLIED: {
      return (
        <StatusCard status="pending" icon={<MdHourglassEmpty />}>
          {t('status.applied')}
        </StatusCard>
      );
    }
    case CourseEnrollmentStatus_enum.REJECTED: {
      return (
        <StatusCard status="error" icon={<MdCancel />}>
          {t('status.rejected')}
        </StatusCard>
      );
    }
    case CourseEnrollmentStatus_enum.CANCELLED: {
      return (
        <StatusCard status="warning" icon={<MdCancel />}>
          {t('status.cancelled')}
        </StatusCard>
      );
    }
    case CourseEnrollmentStatus_enum.INVITED: {
      if (
        courseEnrollment.invitationExpirationDate &&
        new Date(courseEnrollment.invitationExpirationDate).setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0)
      ) {
        return (
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full">
            <div className="flex-1">
              <StatusCard status="success" icon={<MdMailOutline />}>
                {t('status.invited')}
              </StatusCard>
            </div>
            <Button
              filled
              inverted
              onClick={() => {
                // This will be handled by the parent component
                console.log('Accept invitation clicked');
              }}
              className="bg-green-600 hover:bg-green-700 transition-colors duration-200 px-6 py-3 font-medium"
            >
              {t('registration.accept_invitation')}
            </Button>
          </div>
        );
      } else {
        return (
          <StatusCard status="warning" icon={<MdAccessTime />}>
            {t('status.invitation_expired')}
          </StatusCard>
        );
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
