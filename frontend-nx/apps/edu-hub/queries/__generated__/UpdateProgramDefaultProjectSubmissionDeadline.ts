/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProgramDefaultProjectSubmissionDeadline
// ====================================================

export interface UpdateProgramDefaultProjectSubmissionDeadline_update_Program_by_pk {
  __typename: "Program";
  id: number;
  /**
   * Program-wide default for the project submission deadline. Used when a course does not set its own Course.projectSubmissionDeadline. Backfilled from the deprecated Program.achievementRecordUploadDeadline column, which will be dropped in Step 2.
   */
  defaultProjectSubmissionDeadline: any | null;
}

export interface UpdateProgramDefaultProjectSubmissionDeadline {
  /**
   * update single row of the table: "Program"
   */
  update_Program_by_pk: UpdateProgramDefaultProjectSubmissionDeadline_update_Program_by_pk | null;
}

export interface UpdateProgramDefaultProjectSubmissionDeadlineVariables {
  itemId: number;
  value?: any | null;
}
