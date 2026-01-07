/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: ValidateFormbricksSurvey
// ====================================================

export interface ValidateFormbricksSurvey_validateFormbricksSurvey_addonQuestions_warnings {
  __typename: "AddonWarning";
  type: string;
  message: string;
  severity: string;
}

export interface ValidateFormbricksSurvey_validateFormbricksSurvey_addonQuestions_allDetectedPrices {
  __typename: "DetectedPrice";
  language: string;
  priceInCents: number;
  currency: string;
  originalText: string;
}

export interface ValidateFormbricksSurvey_validateFormbricksSurvey_addonQuestions {
  __typename: "AddonQuestion";
  questionId: string;
  questionType: string;
  questionText: string | null;
  extractedPrice: number;
  extractedCurrency: string;
  confidence: string;
  warnings: ValidateFormbricksSurvey_validateFormbricksSurvey_addonQuestions_warnings[] | null;
  allDetectedPrices: ValidateFormbricksSurvey_validateFormbricksSurvey_addonQuestions_allDetectedPrices[] | null;
  description: string;
}

export interface ValidateFormbricksSurvey_validateFormbricksSurvey {
  __typename: "ValidateFormbricksSurveyResult";
  success: boolean;
  surveyId: string | null;
  surveyTitle: string | null;
  addonQuestions: ValidateFormbricksSurvey_validateFormbricksSurvey_addonQuestions[] | null;
  requiresReview: boolean | null;
  error: string | null;
  messageKey: string | null;
}

export interface ValidateFormbricksSurvey {
  /**
   * Validates a Formbricks survey and extracts add-on questions with pricing information
   */
  validateFormbricksSurvey: ValidateFormbricksSurvey_validateFormbricksSurvey;
}

export interface ValidateFormbricksSurveyVariables {
  surveyUrl: string;
  courseId: number;
}
