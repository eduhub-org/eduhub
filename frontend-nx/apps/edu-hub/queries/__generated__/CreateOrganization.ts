/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { OrganizationType_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: CreateOrganization
// ====================================================

export interface CreateOrganization_insert_Organization_one {
  __typename: "Organization";
  id: number;
  type: OrganizationType_enum;
}

export interface CreateOrganization {
  /**
   * insert a single row into the table: "Organization"
   */
  insert_Organization_one: CreateOrganization_insert_Organization_one | null;
}

export interface CreateOrganizationVariables {
  value: string;
}
