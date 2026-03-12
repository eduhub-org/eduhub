/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { OrganizationAdmin_bool_exp, OrganizationAdmin_order_by } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: OrganizationAdminList
// ====================================================

export interface OrganizationAdminList_OrganizationAdmin_User {
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

export interface OrganizationAdminList_OrganizationAdmin_Organization {
  __typename: "Organization";
  id: number;
  name: string;
}

export interface OrganizationAdminList_OrganizationAdmin {
  __typename: "OrganizationAdmin";
  id: number;
  /**
   * An object relationship
   */
  User: OrganizationAdminList_OrganizationAdmin_User;
  /**
   * An object relationship
   */
  Organization: OrganizationAdminList_OrganizationAdmin_Organization;
  canManageEvents: boolean;
  canManageCourses: boolean;
  canManageSettings: boolean;
}

export interface OrganizationAdminList_OrganizationAdmin_aggregate_aggregate {
  __typename: "OrganizationAdmin_aggregate_fields";
  count: number;
}

export interface OrganizationAdminList_OrganizationAdmin_aggregate {
  __typename: "OrganizationAdmin_aggregate";
  aggregate: OrganizationAdminList_OrganizationAdmin_aggregate_aggregate | null;
}

export interface OrganizationAdminList {
  /**
   * fetch data from the table: "OrganizationAdmin"
   */
  OrganizationAdmin: OrganizationAdminList_OrganizationAdmin[];
  /**
   * fetch aggregated fields from the table: "OrganizationAdmin"
   */
  OrganizationAdmin_aggregate: OrganizationAdminList_OrganizationAdmin_aggregate;
}

export interface OrganizationAdminListVariables {
  limit?: number | null;
  offset?: number | null;
  filter?: OrganizationAdmin_bool_exp | null;
  order_by?: OrganizationAdmin_order_by[] | null;
}
