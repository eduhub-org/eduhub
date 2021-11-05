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
}

export interface User {
  /**
   * fetch data from the table: "User" using primary key columns
   */
  User_by_pk: User_User_by_pk | null;
}

export interface UserVariables {
  authId: any;
}
