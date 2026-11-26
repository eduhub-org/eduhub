/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { IssueReport_bool_exp, IssueReport_order_by, IssueReportType_enum, IssueReportStatus_enum, IssueReportPriority_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: IssueReportList
// ====================================================

export interface IssueReportList_IssueReport_User {
  __typename: "User";
  id: any;
  /**
   * The user's first name
   */
  firstName: string;
  /**
   * The user's last name
   */
  lastName: string;
  /**
   * The user's email address
   */
  email: string;
}

export interface IssueReportList_IssueReport {
  __typename: "IssueReport";
  id: number;
  type: IssueReportType_enum;
  title: string;
  description: string;
  route: string | null;
  role: string | null;
  locale: string | null;
  status: IssueReportStatus_enum;
  priority: IssueReportPriority_enum | null;
  duplicateOfId: number | null;
  publicNote: string | null;
  githubIssueUrl: string | null;
  closedAt: any | null;
  created_at: any;
  updated_at: any;
  /**
   * An object relationship
   */
  User: IssueReportList_IssueReport_User | null;
  /**
   * Votes on the report and on reports marked as its duplicates.
   */
  peopleAffected: number | null;
}

export interface IssueReportList_IssueReport_aggregate_aggregate {
  __typename: "IssueReport_aggregate_fields";
  count: number;
}

export interface IssueReportList_IssueReport_aggregate {
  __typename: "IssueReport_aggregate";
  aggregate: IssueReportList_IssueReport_aggregate_aggregate | null;
}

export interface IssueReportList {
  /**
   * fetch data from the table: "IssueReport"
   */
  IssueReport: IssueReportList_IssueReport[];
  /**
   * fetch aggregated fields from the table: "IssueReport"
   */
  IssueReport_aggregate: IssueReportList_IssueReport_aggregate;
}

export interface IssueReportListVariables {
  limit?: number | null;
  offset?: number | null;
  filter?: IssueReport_bool_exp | null;
  order_by?: IssueReport_order_by[] | null;
}
