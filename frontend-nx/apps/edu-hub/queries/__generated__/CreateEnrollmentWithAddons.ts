/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: CreateEnrollmentWithAddons
// ====================================================

export interface CreateEnrollmentWithAddons_createEnrollmentWithAddons_selectedAddons {
  __typename: "SelectedAddon";
  id: number;
  description: string;
  validatedPrice: number;
  currency: string;
  questionId: string;
  choiceId: string;
}

export interface CreateEnrollmentWithAddons_createEnrollmentWithAddons {
  __typename: "CreateEnrollmentWithAddonsResult";
  success: boolean;
  error: string | null;
  messageKey: string | null;
  enrollmentId: number | null;
  selectedAddons: CreateEnrollmentWithAddons_createEnrollmentWithAddons_selectedAddons[] | null;
}

export interface CreateEnrollmentWithAddons {
  /**
   * Creates a course enrollment and saves selected addons from Formbricks survey to the database
   */
  createEnrollmentWithAddons: CreateEnrollmentWithAddons_createEnrollmentWithAddons;
}

export interface CreateEnrollmentWithAddonsVariables {
  courseId: number;
  userId: any;
  motivationLetter?: string | null;
  formbricksSurveyUrl?: string | null;
  termsAcceptedAt?: any | null;
}
