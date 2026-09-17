import { formatInTimeZone } from 'date-fns-tz';

import { CourseRegistrationType_enum } from '../../../../__generated__/globalTypes';

export interface RegistrationTypeConfig {
  requiresInput: boolean;
  requiresApproval: boolean;
  requiresPayment: boolean;
  isExternal: boolean;
  isDirect: boolean;
}

export const REGISTRATION_TYPE_CONFIG: Record<CourseRegistrationType_enum, RegistrationTypeConfig> = {
  [CourseRegistrationType_enum.APPROVAL_WITH_INPUT]: {
    requiresInput: true,
    requiresApproval: true,
    requiresPayment: false,
    isExternal: false,
    isDirect: false,
  },
  [CourseRegistrationType_enum.EXTERNAL_REGISTRATION]: {
    requiresInput: false,
    requiresApproval: false,
    requiresPayment: false,
    isExternal: true,
    isDirect: false,
  },
  [CourseRegistrationType_enum.DIRECT_WITH_INPUT]: {
    requiresInput: true,
    requiresApproval: false,
    requiresPayment: false,
    isExternal: false,
    isDirect: true,
  },
  [CourseRegistrationType_enum.DIRECT_CONFIRMATION]: {
    requiresInput: false,
    requiresApproval: false,
    requiresPayment: false,
    isExternal: false,
    isDirect: true,
  },
  [CourseRegistrationType_enum.DIRECT_WITH_INPUT_AND_PAYMENT]: {
    requiresInput: true,
    requiresApproval: false,
    requiresPayment: true,
    isExternal: false,
    isDirect: true,
  },
  [CourseRegistrationType_enum.DIRECT_CONFIRMATION_AND_PAYMENT]: {
    requiresInput: false,
    requiresApproval: false,
    requiresPayment: true,
    isExternal: false,
    isDirect: true,
  },
};

export const getRegistrationTypeConfig = (
  registrationType: CourseRegistrationType_enum
): RegistrationTypeConfig => {
  return REGISTRATION_TYPE_CONFIG[registrationType];
};

/** Keep in sync with REGISTRATION_TIME_ZONE in functions/callNodeFunction/guestRegistration.js. */
const REGISTRATION_TIME_ZONE = 'Europe/Berlin';

/**
 * Whether a course has stopped accepting registrations.
 *
 * `applicationEnd` is a date without a time - "last day before applications are
 * closed" - so the deadline day itself is still open and the cut-off is the
 * start of the following day. Which day that is has to be one fixed boundary
 * rather than the visitor's own midnight: comparing against local midnight
 * closed the deadline day a day early for everyone at or west of UTC, and it
 * would disagree with the server-side guard in registerGuestForCourse.
 *
 * The value arrives as a Date pinned to UTC midnight - see the
 * Course.applicationEnd merge in config/apollo.ts - so the calendar day it
 * stands for is read back in UTC.
 *
 * Shared by the registration button and the guest-registration link: they sit on
 * top of each other, so a page that closes one and leaves the other standing
 * contradicts itself.
 */
export const isRegistrationClosed = (applicationEnd: Date, now: Date = new Date()): boolean => {
  // Cannot happen - the column is NOT NULL - but a guard that cannot read its
  // condition should refuse rather than wave the registration through.
  if (!applicationEnd || Number.isNaN(applicationEnd.getTime())) return true;

  const deadlineDay = formatInTimeZone(applicationEnd, 'UTC', 'yyyy-MM-dd');
  const today = formatInTimeZone(now, REGISTRATION_TIME_ZONE, 'yyyy-MM-dd');
  return deadlineDay < today;
};

export interface SelectedAddon {
  id: number;
  description: string;
  validatedPrice: number;
  currency: string;
  questionId: string;
  choiceId: string;
}

export interface RegistrationFormData {
  motivationLetter?: string;
  paymentMethod?: string;
  acceptTerms?: boolean;
  enrollmentId?: number;  // Enrollment ID for payment flows (enrollment created with addons before payment)
  selectedAddons?: SelectedAddon[];  // Deprecated: kept for backward compatibility, not used for payment flows
}

export interface RegistrationResult {
  success: boolean;
  enrollmentId?: number;
  paymentUrl?: string;
  error?: string;
} 