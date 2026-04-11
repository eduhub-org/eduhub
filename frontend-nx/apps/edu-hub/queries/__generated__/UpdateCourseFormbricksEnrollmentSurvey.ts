/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateCourseFormbricksEnrollmentSurvey
// ====================================================

export interface UpdateCourseFormbricksEnrollmentSurvey_saveCourseFormbricksEnrollmentSurvey {
  __typename: "SaveCourseFormbricksEnrollmentSurveyResult";
  success: boolean;
  error: string | null;
  messageKey: string;
  courseId: number | null;
  surveyId: string | null;
  formbricksEnrollmentSurveyUrl: string | null;
}

export interface UpdateCourseFormbricksEnrollmentSurvey {
  /**
   * Saves a course Formbricks survey URL after validating URL format and API token access
   */
  saveCourseFormbricksEnrollmentSurvey: UpdateCourseFormbricksEnrollmentSurvey_saveCourseFormbricksEnrollmentSurvey;
}

export interface UpdateCourseFormbricksEnrollmentSurveyVariables {
  itemId: number;
  text: string;
}
