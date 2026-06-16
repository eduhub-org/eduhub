/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { OrganizationAdmin_insert_input } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: InsertOrganizationAdmin
// ====================================================

export interface InsertOrganizationAdmin_insert_OrganizationAdmin_one {
  __typename: "OrganizationAdmin";
  id: number;
  organizationId: number;
  userId: any;
}

export interface InsertOrganizationAdmin {
  /**
   * insert a single row into the table: "OrganizationAdmin"
   */
  insert_OrganizationAdmin_one: InsertOrganizationAdmin_insert_OrganizationAdmin_one | null;
}

export interface InsertOrganizationAdminVariables {
  input: OrganizationAdmin_insert_input;
}
