/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: ExpertContacts
// ====================================================

export interface ExpertContacts_User {
  __typename: "User";
  id: any;
  /**
   * The user's email address
   */
  email: string;
  /**
   * The person objected to being contacted about new formats (Art. 21 GDPR). Set by admins and the org admins of their courses, removed only by admins.
   */
  doNotContact: boolean;
}

export interface ExpertContacts {
  /**
   * fetch data from the table: "User"
   */
  User: ExpertContacts_User[];
}

export interface ExpertContactsVariables {
  ids: any[];
}
