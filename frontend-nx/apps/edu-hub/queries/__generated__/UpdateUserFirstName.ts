/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateUserFirstName
// ====================================================

export interface UpdateUserFirstName_update_User_by_pk {
  __typename: "User";
  id: any;
  /**
   * The user's first name
   */
  firstName: string;
}

export interface UpdateUserFirstName {
  /**
   * update single row of the table: "User"
   */
  update_User_by_pk: UpdateUserFirstName_update_User_by_pk | null;
}

export interface UpdateUserFirstNameVariables {
  itemId: any;
  text: string;
}
