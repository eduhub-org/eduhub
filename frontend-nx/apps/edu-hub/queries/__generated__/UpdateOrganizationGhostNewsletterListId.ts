/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateOrganizationGhostNewsletterListId
// ====================================================

export interface UpdateOrganizationGhostNewsletterListId_update_Organization_by_pk {
  __typename: "Organization";
  id: number;
  /**
   * Optional Ghost newsletter list identifier.
   */
  ghostNewsletterListId: string | null;
}

export interface UpdateOrganizationGhostNewsletterListId {
  /**
   * update single row of the table: "Organization"
   */
  update_Organization_by_pk: UpdateOrganizationGhostNewsletterListId_update_Organization_by_pk | null;
}

export interface UpdateOrganizationGhostNewsletterListIdVariables {
  itemId: number;
  text?: string | null;
}
