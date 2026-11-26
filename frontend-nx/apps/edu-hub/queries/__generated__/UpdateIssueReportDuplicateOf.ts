/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { IssueReportStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateIssueReportDuplicateOf
// ====================================================

export interface UpdateIssueReportDuplicateOf_update_IssueReport_by_pk {
  __typename: "IssueReport";
  id: number;
  status: IssueReportStatus_enum;
  duplicateOfId: number | null;
  closedAt: any | null;
}

export interface UpdateIssueReportDuplicateOf {
  /**
   * update single row of the table: "IssueReport"
   */
  update_IssueReport_by_pk: UpdateIssueReportDuplicateOf_update_IssueReport_by_pk | null;
}

export interface UpdateIssueReportDuplicateOfVariables {
  id: number;
  duplicateOfId: number;
}
