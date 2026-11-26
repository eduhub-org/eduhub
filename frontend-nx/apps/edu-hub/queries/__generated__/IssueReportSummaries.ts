/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: IssueReportSummaries
// ====================================================

export interface IssueReportSummaries_IssueReportSummary {
  __typename: "IssueReportSummary";
  id: number;
  periodStart: any;
  periodEnd: any;
  summary: string;
  reportCount: number;
  feedbackCount: number;
  model: string | null;
  costEur: any | null;
  created_at: any;
}

export interface IssueReportSummaries {
  /**
   * fetch data from the table: "IssueReportSummary"
   */
  IssueReportSummary: IssueReportSummaries_IssueReportSummary[];
}
