/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateIssueReportPublicNote
// ====================================================

export interface UpdateIssueReportPublicNote_update_IssueReport_by_pk {
  __typename: "IssueReport";
  id: number;
  publicNote: string | null;
}

export interface UpdateIssueReportPublicNote {
  /**
   * update single row of the table: "IssueReport"
   */
  update_IssueReport_by_pk: UpdateIssueReportPublicNote_update_IssueReport_by_pk | null;
}

export interface UpdateIssueReportPublicNoteVariables {
  itemId: number;
  text?: string | null;
}
