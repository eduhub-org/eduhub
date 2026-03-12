/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteOrganization
// ====================================================

export interface DeleteOrganization_delete_Organization_by_pk {
  __typename: "Organization";
  id: number;
}

export interface DeleteOrganization {
  /**
   * delete single row from the table: "Organization"
   */
  delete_Organization_by_pk: DeleteOrganization_delete_Organization_by_pk | null;
}

export interface DeleteOrganizationVariables {
  id: number;
}
