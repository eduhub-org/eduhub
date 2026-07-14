/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateOrganizationAdminCanManageJobs
// ====================================================

export interface UpdateOrganizationAdminCanManageJobs_update_OrganizationAdmin_by_pk {
  __typename: "OrganizationAdmin";
  id: number;
  /**
   * May create and manage job postings for this organization
   */
  canManageJobs: boolean;
}

export interface UpdateOrganizationAdminCanManageJobs {
  /**
   * update single row of the table: "OrganizationAdmin"
   */
  update_OrganizationAdmin_by_pk: UpdateOrganizationAdminCanManageJobs_update_OrganizationAdmin_by_pk | null;
}

export interface UpdateOrganizationAdminCanManageJobsVariables {
  itemId: number;
  value: boolean;
}
