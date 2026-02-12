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