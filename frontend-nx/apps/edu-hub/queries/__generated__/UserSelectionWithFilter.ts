/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { User_bool_exp, User_order_by } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: UserSelectionWithFilter
// ====================================================

export interface UserSelectionWithFilter_User_Experts {
  __typename: "Expert";
  id: number;
}

export interface UserSelectionWithFilter_User {
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
  updated_at: any | null;
  /**
   * An array relationship
   */
  Experts: UserSelectionWithFilter_User_Experts[];
}

export interface UserSelectionWithFilter {
  /**
   * fetch data from the table: "User"
   */
  User: UserSelectionWithFilter_User[];
}

export interface UserSelectionWithFilterVariables {
  limit?: number | null;
  filter?: User_bool_exp | null;
  order_by?: User_order_by[] | null;
}
