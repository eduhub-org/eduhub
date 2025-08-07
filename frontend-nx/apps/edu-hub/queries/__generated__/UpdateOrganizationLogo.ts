/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateOrganizationLogo
// ====================================================

export interface UpdateOrganizationLogo_update_Organization_by_pk {
  __typename: "Organization";
  id: number;
  /**
   * Path to the organization logo image file
   */
  logo: string | null;
}

export interface UpdateOrganizationLogo {
  /**
   * update single row of the table: "Organization"
   */
  update_Organization_by_pk: UpdateOrganizationLogo_update_Organization_by_pk | null;
}

export interface UpdateOrganizationLogoVariables {
  organizationId: number;
  logo?: string | null;
}
