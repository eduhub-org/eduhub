/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateOrganizationAdminCanManageCourses
// ====================================================

export interface UpdateOrganizationAdminCanManageCourses_update_OrganizationAdmin_by_pk {
  __typename: "OrganizationAdmin";
  id: number;
  canManageCourses: boolean;
}

export interface UpdateOrganizationAdminCanManageCourses {
  /**
   * update single row of the table: "OrganizationAdmin"
   */
  update_OrganizationAdmin_by_pk: UpdateOrganizationAdminCanManageCourses_update_OrganizationAdmin_by_pk | null;
}

export interface UpdateOrganizationAdminCanManageCoursesVariables {
  id: number;
  canManageCourses: boolean;
}
