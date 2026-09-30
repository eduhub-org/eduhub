/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: RemoveOrganizationLogo
// ====================================================

export interface RemoveOrganizationLogo_removeOrganizationLogo {
  __typename: "RemoveOrganizationLogoResult";
  success: boolean;
  messageKey: string | null;
  error: string | null;
}

export interface RemoveOrganizationLogo {
  /**
   * Clears an organization's logo; see authorizeOrganizationAdminFieldChange for who may
   */
  removeOrganizationLogo: RemoveOrganizationLogo_removeOrganizationLogo;
}

export interface RemoveOrganizationLogoVariables {
  organizationId: number;
}
