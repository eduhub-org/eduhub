/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateIssueReportGithubUrl
// ====================================================

export interface UpdateIssueReportGithubUrl_update_IssueReport_by_pk {
  __typename: "IssueReport";
  id: number;
  githubIssueUrl: string | null;
}

export interface UpdateIssueReportGithubUrl {
  /**
   * update single row of the table: "IssueReport"
   */
  update_IssueReport_by_pk: UpdateIssueReportGithubUrl_update_IssueReport_by_pk | null;
}

export interface UpdateIssueReportGithubUrlVariables {
  itemId: number;
  text?: string | null;
}
