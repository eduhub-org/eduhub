/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProjectSubmissionDeadline
// ====================================================

export interface UpdateProjectSubmissionDeadline_update_Project_by_pk {
  __typename: "Project";
  id: number;
  /**
   * Optional per-project submission deadline. When null, the effective deadline is taken from the course (projectSubmissionDeadline) or program defaults.
   */
  submissionDeadline: any | null;
}

export interface UpdateProjectSubmissionDeadline {
  /**
   * update single row of the table: "Project"
   */
  update_Project_by_pk: UpdateProjectSubmissionDeadline_update_Project_by_pk | null;
}

export interface UpdateProjectSubmissionDeadlineVariables {
  itemId: number;
  value?: any | null;
}
