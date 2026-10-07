/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateOrganizationAdminCanViewStatistics
// ====================================================

export interface UpdateOrganizationAdminCanViewStatistics_update_OrganizationAdmin_by_pk {
  __typename: "OrganizationAdmin";
  id: number;
  /**
   * Allows the organization admin to view the statistics (applications, courses, sessions, attendances, certificates) of all programs of the organization
   */
  canViewStatistics: boolean;
}

export interface UpdateOrganizationAdminCanViewStatistics {
  /**
   * update single row of the table: "OrganizationAdmin"
   */
  update_OrganizationAdmin_by_pk: UpdateOrganizationAdminCanViewStatistics_update_OrganizationAdmin_by_pk | null;
}

export interface UpdateOrganizationAdminCanViewStatisticsVariables {
  itemId: number;
  value: boolean;
}
