/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { ProgramType_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: OnboardingTexts
// ====================================================

export interface OnboardingTexts_OnboardingText {
  __typename: "OnboardingText";
  id: number;
  programType: ProgramType_enum;
  lang: string;
  text: string;
}

export interface OnboardingTexts {
  /**
   * fetch data from the table: "OnboardingText"
   */
  OnboardingText: OnboardingTexts_OnboardingText[];
}
