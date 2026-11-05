/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: MarkPrivacyNoticeSeen
// ====================================================

export interface MarkPrivacyNoticeSeen_update_User_by_pk {
  __typename: "User";
  id: any;
  /**
   * Privacy policy version (YYYY-MM-DD) whose update notice the user dismissed; NULL if none.
   */
  privacyNoticeSeenVersion: string | null;
}

export interface MarkPrivacyNoticeSeen {
  /**
   * update single row of the table: "User"
   */
  update_User_by_pk: MarkPrivacyNoticeSeen_update_User_by_pk | null;
}

export interface MarkPrivacyNoticeSeenVariables {
  userId: any;
  version: string;
}
