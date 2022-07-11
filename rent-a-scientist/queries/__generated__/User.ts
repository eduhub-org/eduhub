/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: User
// ====================================================

export interface User_User_by_pk {
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

export interface User {
  /**
   * fetch data from the table: "User" using primary key columns
   */
  User_by_pk: User_User_by_pk | null;
}

export interface UserVariables {
  userId: any;
}
