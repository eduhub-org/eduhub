import { CourseRegistrationType_enum } from '../__generated__/globalTypes';

/**
 * Mail template types that can be edited per course, scoped by course registration type.
 * Must stay aligned with {@link sendEnrollmentEmail}: any status-driven mail needs its
 * template type available here so course-specific rows are created and shown in the UI.
 */
export function getEmailTemplateTypesForCourseRegistration(
  registrationType: CourseRegistrationType_enum | null
): string[] {
  const allTemplates = [
    'APPLICATION_RECEIVED',
    'APPLICATION_RECEIVED_PAID',
    'APPLICATION_CONFIRMED',
    'SESSION_REMINDER',
    'INVITE',
    'DECLINE',
    'REGISTRATION_CONFIRMED',
    'REGISTRATION_CONFIRMED_PAID',
    'WAITLIST_NOTICE',
    'ORGANIZER_ADDED',
  ];

  if (!registrationType || registrationType === CourseRegistrationType_enum.EXTERNAL_REGISTRATION) {
    return [];
  }

  if (
    registrationType === CourseRegistrationType_enum.DIRECT_WITH_INPUT ||
    registrationType === CourseRegistrationType_enum.DIRECT_CONFIRMATION ||
    registrationType === CourseRegistrationType_enum.DIRECT_WITH_INPUT_AND_PAYMENT ||
    registrationType === CourseRegistrationType_enum.DIRECT_CONFIRMATION_AND_PAYMENT
  ) {
    // Self-service registration plus admin actions (invite, add as applied, etc.)
    return [...allTemplates];
  }

  if (registrationType === CourseRegistrationType_enum.APPROVAL_WITH_INPUT) {
    return allTemplates.filter(
      (t) => t !== 'REGISTRATION_CONFIRMED' && t !== 'REGISTRATION_CONFIRMED_PAID'
    );
  }

  return [];
}
