/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateCourseFormbricksEnrollmentSurvey
// ====================================================

export interface UpdateCourseFormbricksEnrollmentSurvey_update_Course_by_pk {
  __typename: "Course";
  id: number;
  /**
   * Full URL to the Formbricks survey for course enrollment/application (for iframe embedding). Overrides program default if set.
   */
  formbricksEnrollmentSurveyUrl: string | null;
}

export interface UpdateCourseFormbricksEnrollmentSurvey {
  /**
   * update single row of the table: "Course"
   */
  update_Course_by_pk: UpdateCourseFormbricksEnrollmentSurvey_update_Course_by_pk | null;
}

export interface UpdateCourseFormbricksEnrollmentSurveyVariables {
  itemId: number;
  text: string;
}
