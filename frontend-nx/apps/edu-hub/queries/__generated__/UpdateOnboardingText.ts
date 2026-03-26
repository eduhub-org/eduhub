/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateOnboardingText
// ====================================================

export interface UpdateOnboardingText_update_OnboardingText_by_pk {
  __typename: "OnboardingText";
  id: number;
  text: string;
}

export interface UpdateOnboardingText {
  /**
   * update single row of the table: "OnboardingText"
   */
  update_OnboardingText_by_pk: UpdateOnboardingText_update_OnboardingText_by_pk | null;
}

export interface UpdateOnboardingTextVariables {
  itemId: number;
  text: string;
}
