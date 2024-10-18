/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateOrganizationType
// ====================================================

export interface UpdateOrganizationType_update_Organization_by_pk {
  __typename: "Organization";
  id: number;
  type: string;
}

export interface UpdateOrganizationType {
  /**
   * update single row of the table: "Organization"
   */
  update_Organization_by_pk: UpdateOrganizationType_update_Organization_by_pk | null;
}

export interface UpdateOrganizationTypeVariables {
  id: number;
  value: string;
}
