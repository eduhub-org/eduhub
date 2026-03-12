/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateUserExternalProfile
// ====================================================

export interface UpdateUserExternalProfile_update_User_by_pk {
  __typename: "User";
  id: any;
  /**
   * A link to an external profile, for example in LinkedIn or Xing
   */
  externalProfile: string | null;
}

export interface UpdateUserExternalProfile {
  /**
   * update single row of the table: "User"
   */
  update_User_by_pk: UpdateUserExternalProfile_update_User_by_pk | null;
}

export interface UpdateUserExternalProfileVariables {
  itemId: any;
  text: string;
}
