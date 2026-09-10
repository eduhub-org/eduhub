/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: AdminGrants
// ====================================================

export interface AdminGrants_OrganizationAdmin {
  __typename: "OrganizationAdmin";
  id: number;
  userId: any;
  organizationId: number;
  canManageSettings: boolean;
}

export interface AdminGrants {
  /**
   * fetch data from the table: "OrganizationAdmin"
   */
  OrganizationAdmin: AdminGrants_OrganizationAdmin[];
}
