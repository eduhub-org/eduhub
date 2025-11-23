/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateOrganizationAdminOrganizationId
// ====================================================

export interface UpdateOrganizationAdminOrganizationId_update_OrganizationAdmin_by_pk {
  __typename: "OrganizationAdmin";
  id: number;
  organizationId: number;
}

export interface UpdateOrganizationAdminOrganizationId {
  /**
   * update single row of the table: "OrganizationAdmin"
   */
  update_OrganizationAdmin_by_pk: UpdateOrganizationAdminOrganizationId_update_OrganizationAdmin_by_pk | null;
}

export interface UpdateOrganizationAdminOrganizationIdVariables {
  id: number;
  organizationId: number;
}
