import { CourseRegistrationType_enum } from '../../../__generated__/globalTypes';

/**
 * The registration type broken down into the independent switches shown in the
 * manage view. Not every combination exists as an enum value: an application
 * process always includes the questionnaire and never a payment.
 */
export interface RegistrationFlags {
  external: boolean;
  application: boolean;
  questionnaire: boolean;
  payment: boolean;
}

export const registrationTypeToFlags = (type: CourseRegistrationType_enum | null): RegistrationFlags => {
  // A course without a type is treated as an application (the column default).
  const value = type ?? CourseRegistrationType_enum.APPROVAL_WITH_INPUT;
  if (value === CourseRegistrationType_enum.EXTERNAL_REGISTRATION) {
    return { external: true, application: false, questionnaire: false, payment: false };
  }
  const application = value === CourseRegistrationType_enum.APPROVAL_WITH_INPUT;
  return {
    external: false,
    application,
    questionnaire: application || value.includes('INPUT'),
    payment: value.includes('PAYMENT'),
  };
};

export const flagsToRegistrationType = (flags: RegistrationFlags): CourseRegistrationType_enum => {
  if (flags.external) return CourseRegistrationType_enum.EXTERNAL_REGISTRATION;
  if (flags.application) return CourseRegistrationType_enum.APPROVAL_WITH_INPUT;
  if (flags.questionnaire) {
    return flags.payment
      ? CourseRegistrationType_enum.DIRECT_WITH_INPUT_AND_PAYMENT
      : CourseRegistrationType_enum.DIRECT_WITH_INPUT;
  }
  return flags.payment
    ? CourseRegistrationType_enum.DIRECT_CONFIRMATION_AND_PAYMENT
    : CourseRegistrationType_enum.DIRECT_CONFIRMATION;
};
