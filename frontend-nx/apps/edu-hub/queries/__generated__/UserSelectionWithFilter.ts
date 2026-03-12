/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { User_bool_exp, User_order_by } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: UserSelectionWithFilter
// ====================================================

export interface UserSelectionWithFilter_User_Organization {
  __typename: "Organization";
  id: number;
  name: string;
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
  /**
   * The user's profile picture
   */
  picture: string | null;
  /**
   * A link to an external profile, for example in LinkedIn or Xing
   */
  externalProfile: string | null;
  /**
   * The user's postal/zip code
   */
  zipCode: string | null;
  /**
   * The user's country of residence
   */
  country: string | null;
  /**
   * An object relationship
   */
  Organization: UserSelectionWithFilter_User_Organization | null;
  updated_at: any | null;
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
