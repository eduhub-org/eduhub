/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateOrganizationRausgegangenTestMode
// ====================================================

export interface UpdateOrganizationRausgegangenTestMode_update_Organization_by_pk {
  __typename: "Organization";
  id: number;
}

export interface UpdateOrganizationRausgegangenTestMode {
  /**
   * update single row of the table: "Organization"
   */
  update_Organization_by_pk: UpdateOrganizationRausgegangenTestMode_update_Organization_by_pk | null;
}

export interface UpdateOrganizationRausgegangenTestModeVariables {
  id: number;
  value: boolean;
}
