/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: SettingsAdminGrants
// ====================================================

export interface SettingsAdminGrants_OrganizationAdmin {
  __typename: "OrganizationAdmin";
  id: number;
  organizationId: number;
}

export interface SettingsAdminGrants {
  /**
   * fetch data from the table: "OrganizationAdmin"
   */
  OrganizationAdmin: SettingsAdminGrants_OrganizationAdmin[];
}
