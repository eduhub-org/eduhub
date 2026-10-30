import { CourseEnrollmentStatus_enum, CourseRegistrationType_enum, MailTemplateType_enum } from '../__generated__/globalTypes';

const DIRECT_REGISTRATION_TYPES: string[] = [
  CourseRegistrationType_enum.DIRECT_CONFIRMATION,
  CourseRegistrationType_enum.DIRECT_WITH_INPUT,
  CourseRegistrationType_enum.DIRECT_CONFIRMATION_AND_PAYMENT,
  CourseRegistrationType_enum.DIRECT_WITH_INPUT_AND_PAYMENT,
];

interface StatusChange {
  /** Status before the change; null or undefined for a new enrollment. */
  oldStatus?: CourseEnrollmentStatus_enum | string | null;
  newStatus: CourseEnrollmentStatus_enum | string;
  registrationType?: CourseRegistrationType_enum | string | null;
  /** The enrollment's latest invoice is paid. */
  isPaid?: boolean;
}

/**
 * The mail template a status change sends, or null when it sends none.
 *
 * Every change of an enrollment's status (or invitation deadline) triggers
 * sendEnrollmentEmail, which picks the template from the new status. A renewed
 * invitation therefore sends INVITE again. This mirrors its choice so that
 * organizers can be told before they confirm a change, and participants after
 * theirs.
 * Keep in sync with functions/callNodeFunction/sendEnrollmentEmail/index.js.
 */
export const enrollmentStatusMailTemplate = ({
  oldStatus,
  newStatus,
  registrationType,
  isPaid = false,
}: StatusChange): MailTemplateType_enum | null => {
  if (oldStatus === CourseEnrollmentStatus_enum.WAITLIST) {
    if (newStatus === CourseEnrollmentStatus_enum.INVITED) return MailTemplateType_enum.WAITLIST_PROMOTED;
    if (newStatus === CourseEnrollmentStatus_enum.CONFIRMED) return MailTemplateType_enum.WAITLIST_CONFIRMED;
  }

  switch (newStatus) {
    case CourseEnrollmentStatus_enum.APPLIED:
      return isPaid ? MailTemplateType_enum.APPLICATION_RECEIVED_PAID : MailTemplateType_enum.APPLICATION_RECEIVED;
    case CourseEnrollmentStatus_enum.CONFIRMED:
      if (!DIRECT_REGISTRATION_TYPES.includes(registrationType ?? '')) {
        return MailTemplateType_enum.APPLICATION_CONFIRMED;
      }
      return isPaid ? MailTemplateType_enum.REGISTRATION_CONFIRMED_PAID : MailTemplateType_enum.REGISTRATION_CONFIRMED;
    case CourseEnrollmentStatus_enum.REGISTERED:
      return isPaid ? MailTemplateType_enum.REGISTRATION_CONFIRMED_PAID : MailTemplateType_enum.REGISTRATION_CONFIRMED;
    case CourseEnrollmentStatus_enum.INVITED:
      return MailTemplateType_enum.INVITE;
    case CourseEnrollmentStatus_enum.REJECTED:
      return MailTemplateType_enum.DECLINE;
    case CourseEnrollmentStatus_enum.WAITLIST:
      return MailTemplateType_enum.WAITLIST_NOTICE;
    case CourseEnrollmentStatus_enum.CANCELLED:
      return MailTemplateType_enum.ENROLLMENT_CANCELLED;
    case CourseEnrollmentStatus_enum.ABORTED:
      return MailTemplateType_enum.ENROLLMENT_ABORTED;
    case CourseEnrollmentStatus_enum.EXPIRED:
      return MailTemplateType_enum.INVITATION_EXPIRED;
    default:
      return null;
  }
};
