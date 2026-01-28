import { CourseRegistrationType_enum } from '../../../../__generated__/globalTypes';

export interface RegistrationFeatures {
  hasQuestionnaire: boolean;      // Show Formbricks responses in expanded row
  hasApplicationProcess: boolean; // Show judgement/rating column and controls
  hasPayment: boolean;            // Show payment status column
  tabNameKey: 'applications' | 'registrations' | 'registrations_and_payments';
}

export const getRegistrationFeatures = (
  registrationType: CourseRegistrationType_enum | null
): RegistrationFeatures => {
  // Default to approval-based if null
  if (!registrationType) {
    return {
      hasQuestionnaire: true,
      hasApplicationProcess: true,
      hasPayment: false,
      tabNameKey: 'applications',
    };
  }

  const hasPayment = registrationType.includes('PAYMENT');
  const hasInput = registrationType.includes('INPUT');
  const isApproval = registrationType.startsWith('APPROVAL');

  return {
    hasQuestionnaire: hasInput || isApproval,
    hasApplicationProcess: isApproval,
    hasPayment,
    tabNameKey: hasPayment 
      ? 'registrations_and_payments' 
      : isApproval 
        ? 'applications' 
        : 'registrations',
  };
};
