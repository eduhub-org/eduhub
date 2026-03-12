/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateOrganizationAdminCanManageEvents
// ====================================================

export interface UpdateOrganizationAdminCanManageEvents_update_OrganizationAdmin_by_pk {
  __typename: "OrganizationAdmin";
  id: number;
  canManageEvents: boolean;
}

export interface UpdateOrganizationAdminCanManageEvents {
  /**
   * update single row of the table: "OrganizationAdmin"
   */
  update_OrganizationAdmin_by_pk: UpdateOrganizationAdminCanManageEvents_update_OrganizationAdmin_by_pk | null;
}

export interface UpdateOrganizationAdminCanManageEventsVariables {
  id: number;
  canManageEvents: boolean;
}
