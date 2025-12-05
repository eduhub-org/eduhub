/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: UserForSelection1
// ====================================================

export interface UserForSelection1_User {
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
}

export interface UserForSelection1 {
  /**
   * fetch data from the table: "User"
   */
  User: UserForSelection1_User[];
}

export interface UserForSelection1Variables {
  searchValue: string;
}
