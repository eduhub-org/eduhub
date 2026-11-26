/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpsertSessionAddressOnlineLink
// ====================================================

export interface UpsertSessionAddressOnlineLink_insert_OnlineMeetingLink_one {
  __typename: "OnlineMeetingLink";
  id: number;
  url: string;
  courseLocationId: number | null;
  sessionAddressId: number | null;
}

export interface UpsertSessionAddressOnlineLink {
  /**
   * insert a single row into the table: "OnlineMeetingLink"
   */
  insert_OnlineMeetingLink_one: UpsertSessionAddressOnlineLink_insert_OnlineMeetingLink_one | null;
}

export interface UpsertSessionAddressOnlineLinkVariables {
  itemId: number;
  text: string;
}
