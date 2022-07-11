/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: UserForSelection2
// ====================================================

export interface UserForSelection2_User_Experts {
  __typename: "Expert";
  id: number;
}

export interface UserForSelection2_User {
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
  Experts: UserForSelection2_User_Experts[];
}

export interface UserForSelection2 {
  /**
   * fetch data from the table: "User"
   */
  User: UserForSelection2_User[];
}

export interface UserForSelection2Variables {
  searchValue1: string;
  searchValue2: string;
}
