/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetCourseAddonMappings
// ====================================================

export interface GetCourseAddonMappings_CourseAddonMapping {
  __typename: "CourseAddonMapping";
  id: number;
  courseId: number;
  questionId: string;
  questionTextDe: string | null;
  questionTextEn: string | null;
  /**
   * Price extracted from question text (in cents)
   */
  extractedPrice: number;
  /**
   * Admin-validated price (in cents), can override extracted price
   */
  validatedPrice: number;
  currency: string;
  description: string;
  /**
   * Stripe Product ID for this add-on
   */
  stripeProductId: string | null;
  /**
   * Stripe Price ID for this add-on
   */
  stripePriceId: string | null;
  /**
   * Confidence level: high, medium, or low
   */
  confidence: string | null;
  validatedAt: any | null;
  validatedBy: any | null;
  created_at: any | null;
  updated_at: any | null;
}

export interface GetCourseAddonMappings {
  /**
   * fetch data from the table: "CourseAddonMapping"
   */
  CourseAddonMapping: GetCourseAddonMappings_CourseAddonMapping[];
}

export interface GetCourseAddonMappingsVariables {
  courseId: number;
}
