/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: MyOrgAdminCapabilities
// ====================================================

export interface MyOrgAdminCapabilities_OrganizationAdmin {
  __typename: "OrganizationAdmin";
  canManageCourses: boolean;
  canManageEvents: boolean;
  /**
   * Allows the organization admin to manage programs (and their courses) of type DEGREES for the organization
   */
  canManageDegrees: boolean;
  /**
   * May create and manage job postings for this organization
   */
  canManageJobs: boolean;
}

export interface MyOrgAdminCapabilities {
  /**
   * fetch data from the table: "OrganizationAdmin"
   */
  OrganizationAdmin: MyOrgAdminCapabilities_OrganizationAdmin[];
}

export interface MyOrgAdminCapabilitiesVariables {
  userId: any;
}
