/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { Organization_insert_input, OrganizationType_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: InsertOrganization
// ====================================================

export interface InsertOrganization_insert_Organization_one {
  __typename: "Organization";
  id: number;
  name: string;
  type: OrganizationType_enum;
  description: string | null;
}

export interface InsertOrganization {
  /**
   * insert a single row into the table: "Organization"
   */
  insert_Organization_one: InsertOrganization_insert_Organization_one | null;
}

export interface InsertOrganizationVariables {
  insertInput: Organization_insert_input;
}
