/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateOrganizationGhostNewsletterApiUrl
// ====================================================

export interface UpdateOrganizationGhostNewsletterApiUrl_update_Organization_by_pk {
  __typename: "Organization";
  id: number;
  /**
   * Ghost members API URL used to synchronize newsletter subscriptions.
   */
  ghostNewsletterApiUrl: string | null;
}

export interface UpdateOrganizationGhostNewsletterApiUrl {
  /**
   * update single row of the table: "Organization"
   */
  update_Organization_by_pk: UpdateOrganizationGhostNewsletterApiUrl_update_Organization_by_pk | null;
}

export interface UpdateOrganizationGhostNewsletterApiUrlVariables {
  itemId: number;
  text?: string | null;
}
