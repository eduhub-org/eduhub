/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateOrganizationApiKeyHash
// ====================================================

export interface UpdateOrganizationApiKeyHash_update_Organization_by_pk {
  __typename: "Organization";
  id: number;
}

export interface UpdateOrganizationApiKeyHash {
  /**
   * update single row of the table: "Organization"
   */
  update_Organization_by_pk: UpdateOrganizationApiKeyHash_update_Organization_by_pk | null;
}

export interface UpdateOrganizationApiKeyHashVariables {
  id: number;
  apiKeyHash?: string | null;
}
