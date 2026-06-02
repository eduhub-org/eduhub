/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: OnboardingTexts
// ====================================================

export interface OnboardingTexts_OnboardingText {
  __typename: "OnboardingText";
  id: number;
  programType: string;
  lang: string;
  text: string;
}

export interface OnboardingTexts {
  /**
   * fetch data from the table: "OnboardingText"
   */
  OnboardingText: OnboardingTexts_OnboardingText[];
}
