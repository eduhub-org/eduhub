/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: SetDoNotContact
// ====================================================

export interface SetDoNotContact_update_User_by_pk {
  __typename: "User";
  id: any;
  /**
   * The person objected to being contacted about new formats (Art. 21 GDPR). Set by admins and the org admins of their courses, removed only by admins.
   */
  doNotContact: boolean;
}

export interface SetDoNotContact {
  /**
   * update single row of the table: "User"
   */
  update_User_by_pk: SetDoNotContact_update_User_by_pk | null;
}

export interface SetDoNotContactVariables {
  userId: any;
  doNotContact: boolean;
}
