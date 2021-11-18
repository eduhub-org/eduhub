/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: User
// ====================================================

export interface User_User {
  __typename: "User";
  id: number;
  /**
   * The user's profile picture
   */
  picture: string | null;
}

export interface User {
  /**
   * fetch data from the table: "User"
   */
  User: User_User[];
}

export interface UserVariables {
  authId: any;
}
