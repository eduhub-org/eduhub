/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetSignedUrl
// ====================================================

export interface GetSignedUrl_getSignedUrl {
  __typename: "getSignedUrlOutput";
  link: string;
}

export interface GetSignedUrl {
  /**
   * Gets a signed url for a file in the Google Storage Bucket
   */
  getSignedUrl: GetSignedUrl_getSignedUrl | null;
}

export interface GetSignedUrlVariables {
  path: string;
}
