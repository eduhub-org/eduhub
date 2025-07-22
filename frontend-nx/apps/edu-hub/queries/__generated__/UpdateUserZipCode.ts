/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateUserZipCode
// ====================================================

export interface UpdateUserZipCode_update_User_by_pk {
  __typename: "User";
  id: any;
  /**
   * The user's postal/zip code
   */
  zipCode: string | null;
}

export interface UpdateUserZipCode {
  /**
   * update single row of the table: "User"
   */
  update_User_by_pk: UpdateUserZipCode_update_User_by_pk | null;
}

export interface UpdateUserZipCodeVariables {
  itemId: any;
  text: string;
}
