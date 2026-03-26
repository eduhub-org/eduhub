/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateOrganizationGhostNewsletterSlug
// ====================================================

export interface UpdateOrganizationGhostNewsletterSlug_update_Organization_by_pk {
  __typename: "Organization";
  id: number;
  /**
   * Optional Ghost newsletter slug when list ID is not used.
   */
  ghostNewsletterSlug: string | null;
}

export interface UpdateOrganizationGhostNewsletterSlug {
  /**
   * update single row of the table: "Organization"
   */
  update_Organization_by_pk: UpdateOrganizationGhostNewsletterSlug_update_Organization_by_pk | null;
}

export interface UpdateOrganizationGhostNewsletterSlugVariables {
  itemId: number;
  text?: string | null;
}
