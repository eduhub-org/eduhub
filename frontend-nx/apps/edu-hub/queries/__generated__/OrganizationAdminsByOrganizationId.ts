/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: OrganizationAdminsByOrganizationId
// ====================================================

export interface OrganizationAdminsByOrganizationId_OrganizationAdmin_User {
  __typename: "User";
  id: any;
  /**
   * The user's first name
   */
  firstName: string;
  /**
   * The user's last name
   */
  lastName: string;
  /**
   * The user's email address
   */
  email: string;
}

export interface OrganizationAdminsByOrganizationId_OrganizationAdmin {
  __typename: "OrganizationAdmin";
  id: number;
  userId: any;
  organizationId: number;
  canManageEvents: boolean;
  canManageCourses: boolean;
  /**
   * Allows the organization admin to manage programs (and their courses) of type DEGREES for the organization
   */
  canManageDegrees: boolean;
  /**
   * May create and manage job postings for this organization
   */
  canManageJobs: boolean;
  canManageSettings: boolean;
  /**
   * An object relationship
   */
  User: OrganizationAdminsByOrganizationId_OrganizationAdmin_User;
}

export interface OrganizationAdminsByOrganizationId {
  /**
   * fetch data from the table: "OrganizationAdmin"
   */
  OrganizationAdmin: OrganizationAdminsByOrganizationId_OrganizationAdmin[];
}

export interface OrganizationAdminsByOrganizationIdVariables {
  organizationIds: number[];
}
