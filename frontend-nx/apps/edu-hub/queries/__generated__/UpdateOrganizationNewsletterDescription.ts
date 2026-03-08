/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateOrganizationNewsletterDescription
// ====================================================

export interface UpdateOrganizationNewsletterDescription_update_Organization_by_pk {
  __typename: "Organization";
  id: number;
  /**
   * Short organization newsletter description shown to participants in onboarding and profile preferences.
   */
  newsletterDescription: string | null;
}

export interface UpdateOrganizationNewsletterDescription {
  /**
   * update single row of the table: "Organization"
   */
  update_Organization_by_pk: UpdateOrganizationNewsletterDescription_update_Organization_by_pk | null;
}

export interface UpdateOrganizationNewsletterDescriptionVariables {
  itemId: number;
  text?: string | null;
}
