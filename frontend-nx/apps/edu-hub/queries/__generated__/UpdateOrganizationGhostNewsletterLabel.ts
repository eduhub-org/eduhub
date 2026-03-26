/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateOrganizationGhostNewsletterLabel
// ====================================================

export interface UpdateOrganizationGhostNewsletterLabel_update_Organization_by_pk {
  __typename: "Organization";
  id: number;
  /**
   * Optional custom newsletter label shown in participant-facing UIs.
   */
  ghostNewsletterLabel: string | null;
}

export interface UpdateOrganizationGhostNewsletterLabel {
  /**
   * update single row of the table: "Organization"
   */
  update_Organization_by_pk: UpdateOrganizationGhostNewsletterLabel_update_Organization_by_pk | null;
}

export interface UpdateOrganizationGhostNewsletterLabelVariables {
  itemId: number;
  text?: string | null;
}
