/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateUserOrganizationId
// ====================================================

export interface UpdateUserOrganizationId_update_User_by_pk {
  __typename: "User";
  id: any;
  /**
   * Referring to where the user is occupied. Could be the user's company, higher education institution, or any organization.
   */
  organizationId: number | null;
}

export interface UpdateUserOrganizationId {
  /**
   * update single row of the table: "User"
   */
  update_User_by_pk: UpdateUserOrganizationId_update_User_by_pk | null;
}

export interface UpdateUserOrganizationIdVariables {
  userId: any;
  value?: number | null;
}
