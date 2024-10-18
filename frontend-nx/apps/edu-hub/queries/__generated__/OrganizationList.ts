/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { Organization_bool_exp, Organization_order_by } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: OrganizationList
// ====================================================

export interface OrganizationList_Organization {
  __typename: "Organization";
  id: number;
  name: string;
  type: string;
  description: string | null;
  aliases: any | null;
}

export interface OrganizationList_Organization_aggregate_aggregate {
  __typename: "Organization_aggregate_fields";
  count: number;
}

export interface OrganizationList_Organization_aggregate {
  __typename: "Organization_aggregate";
  aggregate: OrganizationList_Organization_aggregate_aggregate | null;
}

export interface OrganizationList_OrganizationType {
  __typename: "OrganizationType";
  value: string;
}

export interface OrganizationList {
  /**
   * fetch data from the table: "Organization"
   */
  Organization: OrganizationList_Organization[];
  /**
   * fetch aggregated fields from the table: "Organization"
   */
  Organization_aggregate: OrganizationList_Organization_aggregate;
  /**
   * fetch data from the table: "OrganizationType"
   */
  OrganizationType: OrganizationList_OrganizationType[];
}

export interface OrganizationListVariables {
  limit?: number | null;
  offset?: number | null;
  filter?: Organization_bool_exp | null;
  order_by?: Organization_order_by[] | null;
}
