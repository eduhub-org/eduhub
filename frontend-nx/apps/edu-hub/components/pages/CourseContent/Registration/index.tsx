import { FC, useCallback, useState } from 'react';

import { CourseRegistrationType_enum } from '../../../../__generated__/globalTypes';
import { canRetryPayment } from '../../../../utils/invoicePaymentStatus';
import { Course_Course_by_pk } from '../../../../queries/__generated__/Course';
import { CourseWithEnrollment_Course_by_pk_CourseEnrollments } from '../../../../queries/__generated__/CourseWithEnrollment';
import { useIsLoggedIn } from '../../../../hooks/authentication';
import { useTranslations } from 'next-intl';

import { RegistrationButton } from './RegistrationButton';
import { RegistrationStatus } from './RegistrationStatus';
import { RegistrationModal } from './RegistrationModal';
import { GuestRegistrationModal } from './GuestRegistrationModal';
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
   * Optional callback after successful enrollment creation.
   * `waitlist` is true when the user was placed on the course waitlist (course full).
   */
  onRegistrationSuccess?: (info?: { waitlist: boolean }) => void;
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
  const tGuest = useTranslations('guest');
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const openGuestModal = useCallback(() => setIsGuestModalOpen(true), []);
  const closeGuestModal = useCallback(() => setIsGuestModalOpen(false), []);

  // Mirrors the backend guard in registerGuestForCourse. Both checks exist on
  // purpose: this one keeps the button off a page where it would fail, the
  // server-side one is what actually enforces it.
  const canRegisterAsGuest =
    !!course.guestRegistrationEnabled &&
    (course.registrationType === CourseRegistrationType_enum.DIRECT_CONFIRMATION ||
      course.registrationType === CourseRegistrationType_enum.DIRECT_WITH_INPUT);

  const isCourseFull =
    course.maxParticipants != null &&
    (course.activeParticipantCount ?? 0) >= course.maxParticipants;

  const registrationHandler = useRegistrationHandler({
    course,
    isCourseFull,
    onSuccess: onRegistrationSuccess,
  });

  // If user has an enrollment, show status
  if (courseEnrollment) {
    return (
      <div className="w-full">
        <RegistrationStatus 
          courseEnrollment={courseEnrollment} 
          course={course}
          onRetryPayment={canRetryPayment(courseEnrollment.Invoices)
            ? () => registrationHandler.retryPayment(courseEnrollment.id)
            : undefined
          }
        />
        {/* Always render modal so it can be opened for retry payment flow */}
        <RegistrationModal
          visible={registrationHandler.isModalOpen}
          closeModal={registrationHandler.closeModal}
          course={course}
          registrationType={registrationHandler.registrationType}
          onSubmit={registrationHandler.submitRegistration}
          isLoading={registrationHandler.isLoading}
          retryEnrollmentId={registrationHandler.retryEnrollmentId}
          isCourseFull={isCourseFull && !registrationHandler.retryEnrollmentId}
        />
      </div>
    );
  }

  // If not logged in: for external link registration, open link directly; otherwise prompt login
  if (!isLoggedIn) {
    const isExternalWithLink =
      !isCourseFull && registrationHandler.config.isExternal && course.externalRegistrationLink;
    return (
      <div className="w-full">
        <RegistrationButton
          course={course}
          registrationType={course.registrationType || CourseRegistrationType_enum.APPROVAL_WITH_INPUT}
          isCourseFull={isCourseFull}
          onClick={
            isExternalWithLink
              ? registrationHandler.handleExternalRegistration
              : registrationHandler.handleLogin
          }
        />
        {/* Offered alongside login, never instead of it: an account is still the
            better option for anyone who has one, so guest registration is the
            second choice on the page, not the default. */}
        {canRegisterAsGuest && (
          <>
            <button
              type="button"
              onClick={openGuestModal}
              className="mt-3 w-full text-sm text-brand hover:underline min-h-[44px]"
            >
              {tGuest('register_without_account')}
            </button>
            <GuestRegistrationModal
              visible={isGuestModalOpen}
              closeModal={closeGuestModal}
              course={course}
            />
          </>
        )}
      </div>
    );
  }

  // Show appropriate registration button based on registration type
  return (
    <div className="w-full">
      <RegistrationButton
        course={course}
        registrationType={course.registrationType || CourseRegistrationType_enum.APPROVAL_WITH_INPUT}
        isCourseFull={isCourseFull}
        onClick={registrationHandler.handleRegistration}
      />
      <RegistrationModal
        visible={registrationHandler.isModalOpen}
        closeModal={registrationHandler.closeModal}
        course={course}
        registrationType={registrationHandler.registrationType}
        onSubmit={registrationHandler.submitRegistration}
        isLoading={registrationHandler.isLoading}
        retryEnrollmentId={registrationHandler.retryEnrollmentId}
        isCourseFull={isCourseFull && !registrationHandler.retryEnrollmentId}
      />
    </div>
  );
};

export default Registration;
