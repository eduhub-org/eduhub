/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateOrganizationName
// ====================================================

export interface UpdateOrganizationName_update_Organization_by_pk {
  __typename: "Organization";
  id: number;
  name: string;
}

export interface UpdateOrganizationName {
  /**
   * update single row of the table: "Organization"
   */
  update_Organization_by_pk: UpdateOrganizationName_update_Organization_by_pk | null;
}

export interface UpdateOrganizationNameVariables {
  itemId: number;
  text: string;
}
