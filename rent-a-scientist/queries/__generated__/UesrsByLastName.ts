/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { User_bool_exp } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: UesrsByLastName
// ====================================================

export interface UesrsByLastName_User_aggregate_aggregate {
  __typename: "User_aggregate_fields";
  count: number;
}

export interface UesrsByLastName_User_aggregate {
  __typename: "User_aggregate";
  aggregate: UesrsByLastName_User_aggregate_aggregate | null;
}

export interface UesrsByLastName_User {
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

export interface UesrsByLastName {
  /**
   * fetch aggregated fields from the table: "User"
   */
  User_aggregate: UesrsByLastName_User_aggregate;
  /**
   * fetch data from the table: "User"
   */
  User: UesrsByLastName_User[];
}

export interface UesrsByLastNameVariables {
  limit: number;
  offset: number;
  filter: User_bool_exp;
}
