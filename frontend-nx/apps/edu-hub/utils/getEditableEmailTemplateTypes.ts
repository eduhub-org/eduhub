import { CourseRegistrationType_enum } from '../__generated__/globalTypes';

interface EditableEmailTemplateCourse {
  registrationType: CourseRegistrationType_enum | null;
  attendanceCertificatePossible?: boolean | null;
  achievementCertificatePossible?: boolean | null;
}

/**
 * Mail template types an offering may customize, reduced to the participant-facing
 * mails that actually go out for its registration type. Everything else (expiry,
 * cancellation, organizer and payment notices) stays a system default that is
 * edited in the settings only. Sending falls back to the default per type
 * (functions/callNodeFunction/lib/queueEmail.js), so a course only needs a row
 * for the types it really changes.
 */
export function getEditableEmailTemplateTypes(course: EditableEmailTemplateCourse): string[] {
  const { registrationType } = course;
  if (registrationType === CourseRegistrationType_enum.EXTERNAL_REGISTRATION) {
    return [];
  }

  let registrationTemplates: string[];
  switch (registrationType) {
    case CourseRegistrationType_enum.DIRECT_CONFIRMATION:
    case CourseRegistrationType_enum.DIRECT_WITH_INPUT:
      registrationTemplates = ['REGISTRATION_CONFIRMED'];
      break;
    case CourseRegistrationType_enum.DIRECT_CONFIRMATION_AND_PAYMENT:
    case CourseRegistrationType_enum.DIRECT_WITH_INPUT_AND_PAYMENT:
      registrationTemplates = ['REGISTRATION_CONFIRMED_PAID'];
      break;
    default:
      // APPROVAL_WITH_INPUT, also the column default when the type is missing
      registrationTemplates = ['APPLICATION_RECEIVED', 'INVITE', 'DECLINE', 'APPLICATION_CONFIRMED'];
  }

  return [
    ...registrationTemplates,
    'WAITLIST_NOTICE',
    'SESSION_REMINDER',
    ...(course.attendanceCertificatePossible ? ['CERTIFICATE_ATTENDANCE_READY'] : []),
    ...(course.achievementCertificatePossible ? ['CERTIFICATE_ACHIEVEMENT_READY'] : []),
  ];
}
