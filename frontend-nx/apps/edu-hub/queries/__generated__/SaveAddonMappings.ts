/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { AddonMappingInput } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: SaveAddonMappings
// ====================================================

export interface SaveAddonMappings_saveAddonMappings_stripeResults_results {
  __typename: "StripePriceResult";
  questionId: string;
  choiceId: string;
  stripeProductId: string | null;
  stripePriceId: string | null;
  success: boolean;
  error: string | null;
}

export interface SaveAddonMappings_saveAddonMappings_stripeResults_summary {
  __typename: "StripePriceSummary";
  total: number;
  success: number;
  failures: number;
}

export interface SaveAddonMappings_saveAddonMappings_stripeResults {
  __typename: "StripePriceCreationResult";
  success: boolean;
  results: SaveAddonMappings_saveAddonMappings_stripeResults_results[];
  summary: SaveAddonMappings_saveAddonMappings_stripeResults_summary;
}

export interface SaveAddonMappings_saveAddonMappings {
  __typename: "SaveAddonMappingsResult";
  success: boolean;
  messageKey: string;
  error: string | null;
  stripeResults: SaveAddonMappings_saveAddonMappings_stripeResults | null;
}

export interface SaveAddonMappings {
  /**
   * Saves validated add-on mappings and creates Stripe Products/Prices
   */
  saveAddonMappings: SaveAddonMappings_saveAddonMappings;
}

export interface SaveAddonMappingsVariables {
  courseId: number;
  mappings: AddonMappingInput[];
}
