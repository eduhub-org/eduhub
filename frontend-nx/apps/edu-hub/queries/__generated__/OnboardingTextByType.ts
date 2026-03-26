/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { ProgramType_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: OnboardingTextByType
// ====================================================

export interface OnboardingTextByType_OnboardingText {
  __typename: "OnboardingText";
  id: number;
  programType: ProgramType_enum;
  lang: string;
  text: string;
}

export interface OnboardingTextByType {
  /**
   * fetch data from the table: "OnboardingText"
   */
  OnboardingText: OnboardingTextByType_OnboardingText[];
}

export interface OnboardingTextByTypeVariables {
  programType: ProgramType_enum;
}
