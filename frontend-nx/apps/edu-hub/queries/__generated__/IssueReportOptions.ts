/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: IssueReportOptions
// ====================================================

export interface IssueReportOptions_IssueReport {
  __typename: "IssueReport";
  id: number;
  title: string;
}

export interface IssueReportOptions {
  /**
   * fetch data from the table: "IssueReport"
   */
  IssueReport: IssueReportOptions_IssueReport[];
}
