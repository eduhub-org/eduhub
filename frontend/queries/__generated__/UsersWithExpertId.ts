/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { User_order_by, User_bool_exp } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: UsersWithExpertId
// ====================================================

export interface UsersWithExpertId_User_aggregate_aggregate {
  __typename: "User_aggregate_fields";
  count: number;
}

export interface UsersWithExpertId_User_aggregate {
  __typename: "User_aggregate";
  aggregate: UsersWithExpertId_User_aggregate_aggregate | null;
}

export interface UsersWithExpertId_User_Experts {
  __typename: "Expert";
  id: number;
}

export interface UsersWithExpertId_User {
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
   * An array relationship
   */
  Experts: UsersWithExpertId_User_Experts[];
}

export interface UsersWithExpertId {
  /**
   * fetch aggregated fields from the table: "User"
   */
  User_aggregate: UsersWithExpertId_User_aggregate;
  /**
   * fetch data from the table: "User"
   */
  User: UsersWithExpertId_User[];
}

export interface UsersWithExpertIdVariables {
  userOrderBy?: User_order_by | null;
  limit?: number | null;
  offset?: number | null;
  where?: User_bool_exp | null;
}
