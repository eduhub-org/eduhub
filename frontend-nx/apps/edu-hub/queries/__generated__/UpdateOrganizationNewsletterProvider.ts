/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateOrganizationNewsletterProvider
// ====================================================

export interface UpdateOrganizationNewsletterProvider_update_Organization_by_pk {
  __typename: "Organization";
  id: number;
  /**
   * Newsletter provider for this organization. Currently only GHOST is supported.
   */
  newsletterProvider: string;
}

export interface UpdateOrganizationNewsletterProvider {
  /**
   * update single row of the table: "Organization"
   */
  update_Organization_by_pk: UpdateOrganizationNewsletterProvider_update_Organization_by_pk | null;
}

export interface UpdateOrganizationNewsletterProviderVariables {
  id: number;
  value: string;
}
