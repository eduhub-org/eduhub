/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateUserLastName
// ====================================================

export interface UpdateUserLastName_update_User_by_pk {
  __typename: "User";
  id: any;
  /**
   * The user's last name
   */
  lastName: string;
}

export interface UpdateUserLastName {
  /**
   * update single row of the table: "User"
   */
  update_User_by_pk: UpdateUserLastName_update_User_by_pk | null;
}

export interface UpdateUserLastNameVariables {
  itemId: any;
  text: string;
}
