/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProgramDefaultEnrollmentSurvey
// ====================================================

export interface UpdateProgramDefaultEnrollmentSurvey_update_Program_by_pk {
  __typename: "Program";
  id: number;
}

export interface UpdateProgramDefaultEnrollmentSurvey {
  /**
   * update single row of the table: "Program"
   */
  update_Program_by_pk: UpdateProgramDefaultEnrollmentSurvey_update_Program_by_pk | null;
}

export interface UpdateProgramDefaultEnrollmentSurveyVariables {
  itemId: number;
  text: string;
}
