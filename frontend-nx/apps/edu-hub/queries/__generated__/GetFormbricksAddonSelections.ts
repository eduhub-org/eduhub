/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetFormbricksAddonSelections
// ====================================================

export interface GetFormbricksAddonSelections_getFormbricksAddonSelections_selectedAddons {
  __typename: "SelectedAddon";
  id: number;
  description: string;
  validatedPrice: number;
  currency: string;
  questionId: string;
  choiceId: string;
}

export interface GetFormbricksAddonSelections_getFormbricksAddonSelections {
  __typename: "GetFormbricksAddonSelectionsResult";
  success: boolean;
  error: string | null;
  messageKey: string | null;
  selectedAddons: GetFormbricksAddonSelections_getFormbricksAddonSelections_selectedAddons[] | null;
}

export interface GetFormbricksAddonSelections {
  /**
   * Fetches selected addons from Formbricks survey responses for course registration
   */
  getFormbricksAddonSelections: GetFormbricksAddonSelections_getFormbricksAddonSelections;
}

export interface GetFormbricksAddonSelectionsVariables {
  courseId: number;
  userId: any;
  formbricksSurveyUrl: string;
}
