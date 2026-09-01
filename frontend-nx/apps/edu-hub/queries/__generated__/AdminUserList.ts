/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { User_bool_exp, User_order_by } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: AdminUserList
// ====================================================

export interface AdminUserList_User_Organization {
  __typename: "Organization";
  id: number;
  name: string;
}

export interface AdminUserList_User_OrganizationAdmins_Organization {
  __typename: "Organization";
  id: number;
  name: string;
}

export interface AdminUserList_User_OrganizationAdmins {
  __typename: "OrganizationAdmin";
  id: number;
  organizationId: number;
  /**
   * An object relationship
   */
  Organization: AdminUserList_User_OrganizationAdmins_Organization;
  canManageEvents: boolean;
  canManageCourses: boolean;
  /**
   * Allows the organization admin to manage programs (and their courses) of type DEGREES for the organization
   */
  canManageDegrees: boolean;
  /**
   * May create and manage job postings for this organization
   */
  canManageJobs: boolean;
  canManageSettings: boolean;
}

export interface AdminUserList_User {
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
  /**
   * An object relationship
   */
  Organization: AdminUserList_User_Organization | null;
  /**
   * An array relationship
   */
  OrganizationAdmins: AdminUserList_User_OrganizationAdmins[];
}

export interface AdminUserList_User_aggregate_aggregate {
  __typename: "User_aggregate_fields";
  count: number;
}

export interface AdminUserList_User_aggregate {
  __typename: "User_aggregate";
  aggregate: AdminUserList_User_aggregate_aggregate | null;
}

export interface AdminUserList {
  /**
   * fetch data from the table: "User"
   */
  User: AdminUserList_User[];
  /**
   * fetch aggregated fields from the table: "User"
   */
  User_aggregate: AdminUserList_User_aggregate;
}

export interface AdminUserListVariables {
  limit?: number | null;
  offset?: number | null;
  filter?: User_bool_exp | null;
  order_by?: User_order_by[] | null;
}
