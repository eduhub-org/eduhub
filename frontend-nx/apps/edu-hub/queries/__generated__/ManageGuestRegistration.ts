/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: ManageGuestRegistration
// ====================================================

export interface ManageGuestRegistration_manageGuestRegistration_registrations {
  __typename: "GuestRegistrationSummary";
  courseId: number;
  courseTitle: string;
  startTime: any | null;
  endTime: any | null;
  status: string;
}

export interface ManageGuestRegistration_manageGuestRegistration {
  __typename: "ManageGuestRegistrationResult";
  success: boolean;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  registrations: ManageGuestRegistration_manageGuestRegistration_registrations[] | null;
  error: string | null;
  messageKey: string | null;
}

export interface ManageGuestRegistration {
  /**
   * Token-authenticated self-service for guests without a login - lists their registrations, cancels one, or erases all their personal data (GDPR Art. 15/17).
   */
  manageGuestRegistration: ManageGuestRegistration_manageGuestRegistration;
}

export interface ManageGuestRegistrationVariables {
  token: string;
  operation: string;
  courseId?: number | null;
}
