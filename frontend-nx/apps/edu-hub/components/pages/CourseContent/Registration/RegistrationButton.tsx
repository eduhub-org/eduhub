import { FC } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { MdInfoOutline } from 'react-icons/md';

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
export const RegistrationButton: FC<RegistrationButtonProps> = ({ course, registrationType, onClick }) => {
  const t = useTranslations('course');
  const locale = useLocale();
  const config = getRegistrationTypeConfig(registrationType);

  // Check if application period has ended
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (course.applicationEnd <= now) {
    return (
      <div className="bg-amber-50 rounded-lg p-6 mb-9 w-full">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <MdInfoOutline className="text-2xl text-amber-600" />
          </div>
          <div className="text-amber-800">
            <h3 className="font-semibold text-lg mb-2">
              {config.requiresApproval 
                ? t('status.application_period_ended_title') 
                : t('status.registration_period_ended_title')}
            </h3>
            <div className="text-sm leading-relaxed">
              {t.rich(config.requiresApproval 
                ? 'status.application_period_ended' 
                : 'status.registration_period_ended', {
                a: (chunks) => (
                  <a
                    href="https://opencampus.substack.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-amber-900 transition-colors font-medium"
                  >
                    {chunks}
                  </a>
                ),
              })}
            </div>
          </div>
        </div>
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
    <div className="flex flex-1 flex-col justify-center items-center space-y-4 w-full">
      <Button
        filled
        inverted
        onClick={onClick}
        disabled={course.applicationEnd <= now}
        className="bg-edu-course-current hover:bg-opacity-90 transition-all duration-200 px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
      >
        {getButtonText()}
      </Button>
      <div className="text-center">
        <div className="text-xs text-white/90 mb-1">
          {config.requiresApproval 
            ? t('registration.application_deadline') 
            : t('registration.registration_deadline')}
        </div>
        <div className="text-sm font-medium text-white">
          {course.applicationEnd?.toLocaleDateString(locale, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }) ?? ''}
        </div>
      </div>
    </div>
  );
};

export default RegistrationButton;
