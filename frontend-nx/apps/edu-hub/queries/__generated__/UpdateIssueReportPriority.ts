/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { IssueReportPriority_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateIssueReportPriority
// ====================================================

export interface UpdateIssueReportPriority_update_IssueReport_by_pk {
  __typename: "IssueReport";
  id: number;
  priority: IssueReportPriority_enum | null;
}

export interface UpdateIssueReportPriority {
  /**
   * update single row of the table: "IssueReport"
   */
  update_IssueReport_by_pk: UpdateIssueReportPriority_update_IssueReport_by_pk | null;
}

export interface UpdateIssueReportPriorityVariables {
  id: number;
  value?: IssueReportPriority_enum | null;
}
