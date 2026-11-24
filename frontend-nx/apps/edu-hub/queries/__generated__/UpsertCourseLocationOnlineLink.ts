/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpsertCourseLocationOnlineLink
// ====================================================

export interface UpsertCourseLocationOnlineLink_insert_OnlineMeetingLink_one {
  __typename: "OnlineMeetingLink";
  id: number;
  url: string;
  courseLocationId: number | null;
  sessionAddressId: number | null;
}

export interface UpsertCourseLocationOnlineLink {
  /**
   * insert a single row into the table: "OnlineMeetingLink"
   */
  insert_OnlineMeetingLink_one: UpsertCourseLocationOnlineLink_insert_OnlineMeetingLink_one | null;
}

export interface UpsertCourseLocationOnlineLinkVariables {
  itemId: number;
  text: string;
}
