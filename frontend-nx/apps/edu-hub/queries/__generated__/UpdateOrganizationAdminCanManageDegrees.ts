/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateOrganizationAdminCanManageDegrees
// ====================================================

export interface UpdateOrganizationAdminCanManageDegrees_update_OrganizationAdmin_by_pk {
  __typename: "OrganizationAdmin";
  id: number;
  /**
   * Allows the organization admin to manage programs (and their courses) of type DEGREES for the organization
   */
  canManageDegrees: boolean;
}

export interface UpdateOrganizationAdminCanManageDegrees {
  /**
   * update single row of the table: "OrganizationAdmin"
   */
  update_OrganizationAdmin_by_pk: UpdateOrganizationAdminCanManageDegrees_update_OrganizationAdmin_by_pk | null;
}

export interface UpdateOrganizationAdminCanManageDegreesVariables {
  id: number;
  canManageDegrees: boolean;
}
