/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { IssueReportStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateIssueReportStatus
// ====================================================

export interface UpdateIssueReportStatus_update_IssueReport_by_pk {
  __typename: "IssueReport";
  id: number;
  status: IssueReportStatus_enum;
  closedAt: any | null;
}

export interface UpdateIssueReportStatus {
  /**
   * update single row of the table: "IssueReport"
   */
  update_IssueReport_by_pk: UpdateIssueReportStatus_update_IssueReport_by_pk | null;
}

export interface UpdateIssueReportStatusVariables {
  id: number;
  value: IssueReportStatus_enum;
}
