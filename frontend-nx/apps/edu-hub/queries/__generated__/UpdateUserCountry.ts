/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateUserCountry
// ====================================================

export interface UpdateUserCountry_update_User_by_pk {
  __typename: "User";
  id: any;
  /**
   * The user's country of residence
   */
  country: string | null;
}

export interface UpdateUserCountry {
  /**
   * update single row of the table: "User"
   */
  update_User_by_pk: UpdateUserCountry_update_User_by_pk | null;
}

export interface UpdateUserCountryVariables {
  userId: any;
  value?: string | null;
}
