import { FC } from 'react';

import { CourseRegistrationType_enum } from '../../../../__generated__/globalTypes';
import { Course_Course_by_pk } from '../../../../queries/__generated__/Course';
import { CourseWithEnrollment_Course_by_pk_CourseEnrollments } from '../../../../queries/__generated__/CourseWithEnrollment';
import { useIsLoggedIn } from '../../../../hooks/authentication';

import { RegistrationButton } from './RegistrationButton';
import { RegistrationStatus } from './RegistrationStatus';
import { RegistrationModal } from './RegistrationModal';
import { useRegistrationHandler } from './hooks/useRegistrationHandler';

/**
 * Props for the Registration component
 */
interface RegistrationProps {
  /** Course data containing registration details, deadlines, and configuration */
  course: Course_Course_by_pk;
  /**
   * Optional enrollment data for the current user. If provided, shows enrollment status.
   * If undefined, shows registration options for non-enrolled users.
   */
  courseEnrollment?: CourseWithEnrollment_Course_by_pk_CourseEnrollments;
  /**
   * Optional callback function called after successful registration.
   * Typically used to refetch course data and update the UI.
   */
  onRegistrationSuccess?: () => void;
}

/**
 * Main Registration component that handles the complete course registration flow.
 *
 * This component automatically determines what to display based on:
 * - User authentication status (logged in vs. not logged in)
 * - User enrollment status (enrolled vs. not enrolled)
 * - Course registration type (approval, direct, external, etc.)
 *
 * Features:
 * - Automatic status detection and appropriate UI rendering
 * - Support for all registration types defined in the backend
 * - Comprehensive error handling and user feedback
 * - Mobile-responsive design
 * - Integration with course chat and online meeting links for enrolled users
 *
 * @param props - The component props
 * @returns JSX element representing the registration interface
 */
export const Registration: FC<RegistrationProps> = ({ course, courseEnrollment, onRegistrationSuccess }) => {
  const isLoggedIn = useIsLoggedIn();

  const registrationHandler = useRegistrationHandler({
    course,
    courseEnrollment,
    onSuccess: onRegistrationSuccess,
  });

  // If user has an enrollment, show status
  if (courseEnrollment) {
    return <RegistrationStatus courseEnrollment={courseEnrollment} course={course} />;
  }

  // If not logged in, show login prompt
  if (!isLoggedIn) {
    return (
      <RegistrationButton
        course={course}
        registrationType={course.registrationType || CourseRegistrationType_enum.APPROVAL_WITH_INPUT}
        onClick={registrationHandler.handleLogin}
        isLoggedIn={false}
      />
    );
  }

  // Show appropriate registration button based on registration type
  return (
    <>
      <RegistrationButton
        course={course}
        registrationType={course.registrationType || CourseRegistrationType_enum.APPROVAL_WITH_INPUT}
        onClick={registrationHandler.handleRegistration}
        isLoggedIn={true}
      />
      <RegistrationModal
        visible={registrationHandler.isModalOpen}
        closeModal={() => registrationHandler.setIsModalOpen(false)}
        course={course}
        registrationType={registrationHandler.registrationType}
        onSubmit={registrationHandler.submitRegistration}
        isLoading={registrationHandler.isLoading}
      />
    </>
  );
};

export default Registration;
