/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { OrganizationFeatureOption_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: InsertOrganizationFeature
// ====================================================

export interface InsertOrganizationFeature_insert_OrganizationFeature_one {
  __typename: "OrganizationFeature";
  id: number;
}

export interface InsertOrganizationFeature {
  /**
   * insert a single row into the table: "OrganizationFeature"
   */
  insert_OrganizationFeature_one: InsertOrganizationFeature_insert_OrganizationFeature_one | null;
}

export interface InsertOrganizationFeatureVariables {
  organizationId: number;
  feature: OrganizationFeatureOption_enum;
}
