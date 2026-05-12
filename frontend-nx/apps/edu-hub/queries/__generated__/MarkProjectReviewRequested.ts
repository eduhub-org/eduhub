/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: MarkProjectReviewRequested
// ====================================================

export interface MarkProjectReviewRequested_update_Project_by_pk {
  __typename: "Project";
  id: number;
  /**
   * Timestamp when project authors asked course staff to review the proposed project (still PROPOSED until staff confirm the team).
   */
  projectReviewRequestedAt: any | null;
}

export interface MarkProjectReviewRequested {
  /**
   * update single row of the table: "Project"
   */
  update_Project_by_pk: MarkProjectReviewRequested_update_Project_by_pk | null;
}

export interface MarkProjectReviewRequestedVariables {
  itemId: number;
  requestedAt: any;
}
