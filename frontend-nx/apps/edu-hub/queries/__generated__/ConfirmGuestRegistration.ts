/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: ConfirmGuestRegistration
// ====================================================

export interface ConfirmGuestRegistration_confirmGuestRegistration {
  __typename: "ConfirmGuestRegistrationResult";
  success: boolean;
  courseId: number | null;
  courseTitle: string | null;
  manageToken: string | null;
  error: string | null;
  messageKey: string | null;
}

export interface ConfirmGuestRegistration {
  /**
   * Redeems a guest double opt-in token, creates the CourseEnrollment (which triggers the existing REGISTRATION_CONFIRMED mail) and returns a long-lived manage token.
   */
  confirmGuestRegistration: ConfirmGuestRegistration_confirmGuestRegistration;
}

export interface ConfirmGuestRegistrationVariables {
  token: string;
}
