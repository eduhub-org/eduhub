/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateOrganizationAdminCanManageSettings
// ====================================================

export interface UpdateOrganizationAdminCanManageSettings_update_OrganizationAdmin_by_pk {
  __typename: "OrganizationAdmin";
  id: number;
  canManageSettings: boolean;
}

export interface UpdateOrganizationAdminCanManageSettings {
  /**
   * update single row of the table: "OrganizationAdmin"
   */
  update_OrganizationAdmin_by_pk: UpdateOrganizationAdminCanManageSettings_update_OrganizationAdmin_by_pk | null;
}

export interface UpdateOrganizationAdminCanManageSettingsVariables {
  id: number;
  canManageSettings: boolean;
}
