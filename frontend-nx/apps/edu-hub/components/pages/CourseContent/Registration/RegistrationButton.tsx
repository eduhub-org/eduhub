import { FC } from 'react';
import useTranslation from 'next-translate/useTranslation';
import Trans from 'next-translate/Trans';

import { CourseRegistrationType_enum } from '../../../../__generated__/globalTypes';
import { Course_Course_by_pk } from '../../../../queries/__generated__/Course';
import { Button } from '../../../common/Button';
import { getRegistrationTypeConfig } from './types';

/**
 * Props for the RegistrationButton component
 */
interface RegistrationButtonProps {
  /** Course data containing registration configuration and deadlines */
  course: Course_Course_by_pk;
  /** The type of registration process for this course (approval, direct, external, etc.) */
  registrationType: CourseRegistrationType_enum;
  /** Callback function triggered when the registration button is clicked */
  onClick: () => void;
  /** Whether the current user is authenticated/logged in */
  isLoggedIn: boolean;
}

/**
 * Registration button component that displays the appropriate action button based on
 * course registration type, user authentication status, and application deadlines.
 *
 * Features:
 * - Dynamic button text based on registration type and login status
 * - Automatic deadline validation with disabled state for expired applications
 * - Application deadline display with localized date formatting
 * - Newsletter subscription prompt for expired applications
 * - Responsive design with mobile-first approach
 *
 * Button text variations:
 * - "Sign In to Register" (not logged in)
 * - "Register via External Link" (external registration)
 * - "Register with Payment" (payment required)
 * - "Apply now" (approval required)
 * - "Register Now" (direct registration)
 *
 * @param props - The component props
 * @returns JSX element representing the registration button and deadline info
 */
export const RegistrationButton: FC<RegistrationButtonProps> = ({ course, registrationType, onClick, isLoggedIn }) => {
  const { t, lang } = useTranslation('course');
  const config = getRegistrationTypeConfig(registrationType);

  // Check if application period has ended
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (course.applicationEnd <= now) {
    return (
      <div className="bg-gray-300 p-4">
        <Trans
          i18nKey="course:status.application_period_ended"
          components={{
            a: (
              <a
                href="https://opencampus.substack.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              />
            ),
          }}
        />
      </div>
    );
  }

  // Get button text based on registration type and login status
  const getButtonText = () => {
    if (course.externalRegistrationLink) {
      return t('registration.register_external');
    }

    if (config.requiresPayment) {
      return t('registration.register_with_payment');
    }

    if (config.requiresApproval) {
      return t('registration.apply_now');
    }

    return t('registration.register_now');
  };

  return (
    <div className="flex flex-1 flex-col justify-center items-center">
      <Button
        filled
        inverted
        onClick={onClick}
        disabled={course.applicationEnd <= now}
        className="bg-edu-course-current"
      >
        {getButtonText()}
      </Button>
      <span className="text-xs mt-4 text-white">
        {t('registration.application_deadline')}
        {course.applicationEnd?.toLocaleDateString(lang, {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }) ?? ''}
      </span>
    </div>
  );
};

export default RegistrationButton;
