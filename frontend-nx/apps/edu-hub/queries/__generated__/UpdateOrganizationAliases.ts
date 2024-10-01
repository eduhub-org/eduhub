/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { Organization_set_input } from "./../../__generated__/globalTypes";

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
  itemId: number;
  text: Organization_set_input;
}
