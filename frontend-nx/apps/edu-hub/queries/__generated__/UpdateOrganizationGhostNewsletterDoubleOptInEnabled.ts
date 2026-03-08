/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateOrganizationGhostNewsletterDoubleOptInEnabled
// ====================================================

export interface UpdateOrganizationGhostNewsletterDoubleOptInEnabled_update_Organization_by_pk {
  __typename: "Organization";
  id: number;
  /**
   * Whether Ghost double opt-in should be used for this organization newsletter.
   */
  ghostNewsletterDoubleOptInEnabled: boolean;
}

export interface UpdateOrganizationGhostNewsletterDoubleOptInEnabled {
  /**
   * update single row of the table: "Organization"
   */
  update_Organization_by_pk: UpdateOrganizationGhostNewsletterDoubleOptInEnabled_update_Organization_by_pk | null;
}

export interface UpdateOrganizationGhostNewsletterDoubleOptInEnabledVariables {
  id: number;
  value: boolean;
}
