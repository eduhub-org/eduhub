/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: MyPrivacyNoticeState
// ====================================================

export interface MyPrivacyNoticeState_User_by_pk {
  __typename: "User";
  id: any;
  created_at: any | null;
  /**
   * Privacy policy version (YYYY-MM-DD) whose update notice the user dismissed; NULL if none.
   */
  privacyNoticeSeenVersion: string | null;
}

export interface MyPrivacyNoticeState {
  /**
   * fetch data from the table: "User" using primary key columns
   */
  User_by_pk: MyPrivacyNoticeState_User_by_pk | null;
}

export interface MyPrivacyNoticeStateVariables {
  userId: any;
}
