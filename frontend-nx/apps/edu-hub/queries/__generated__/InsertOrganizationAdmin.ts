/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: InsertOrganizationAdmin
// ====================================================

export interface InsertOrganizationAdmin_insert_OrganizationAdmin_one {
  __typename: "OrganizationAdmin";
  id: number;
  userId: string;
  organizationId: number;
  canManageCourses: boolean;
  canManageEvents: boolean;
  canManageSettings: boolean;
}

export interface InsertOrganizationAdmin {
  insert_OrganizationAdmin_one: InsertOrganizationAdmin_insert_OrganizationAdmin_one | null;
}

export interface InsertOrganizationAdminVariables {
  userId: string;
  organizationId: number;
  canManageCourses: boolean;
  canManageEvents: boolean;
  canManageSettings: boolean;
}
