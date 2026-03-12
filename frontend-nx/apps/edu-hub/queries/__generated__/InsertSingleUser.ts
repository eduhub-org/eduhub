/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { User_insert_input } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: InsertSingleUser
// ====================================================

export interface InsertSingleUser_insert_User_one {
  __typename: "User";
  id: any;
  /**
   * The user's profile picture
   */
  picture: string | null;
  /**
   * The user's email address
   */
  email: string;
  /**
   * The user's first name
   */
  firstName: string;
  /**
   * The user's last name
   */
  lastName: string;
}

export interface InsertSingleUser {
  /**
   * insert a single row into the table: "User"
   */
  insert_User_one: InsertSingleUser_insert_User_one | null;
}

export interface InsertSingleUserVariables {
  user: User_insert_input;
}
