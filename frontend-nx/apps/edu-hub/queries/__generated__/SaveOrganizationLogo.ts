/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: SaveOrganizationLogo
// ====================================================

export interface SaveOrganizationLogo_saveOrganizationLogo_resizedPaths {
  __typename: "resizedImagePath";
  size: number;
  filePath: string;
  accessUrl: string;
}

export interface SaveOrganizationLogo_saveOrganizationLogo {
  __typename: "saveImageResult";
  success: boolean;
  messageKey: string;
  error: string | null;
  filePath: string;
  accessUrl: string;
  resizedPaths: SaveOrganizationLogo_saveOrganizationLogo_resizedPaths[] | null;
}

export interface SaveOrganizationLogo {
  /**
   * Uploads an organization's logo; the handler requires canManageSettings for that organization
   */
  saveOrganizationLogo: SaveOrganizationLogo_saveOrganizationLogo;
}

export interface SaveOrganizationLogoVariables {
  base64File: string;
  fileName: string;
  organizationId: number;
}
