/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateOrganizationAliases
// ====================================================

export interface UpdateOrganizationAliases_update_Organization_by_pk {
  __typename: "Organization";
  id: number;
  aliases: any | null;
}

export interface UpdateOrganizationAliases {
  /**
   * update single row of the table: "Organization"
   */
  update_Organization_by_pk: UpdateOrganizationAliases_update_Organization_by_pk | null;
}

export interface UpdateOrganizationAliasesVariables {
  id: number;
  tags: any;
}
