/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { OrganizationFeatureOption_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: DeleteOrganizationFeature
// ====================================================

export interface DeleteOrganizationFeature_delete_OrganizationFeature {
  __typename: "OrganizationFeature_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
}

export interface DeleteOrganizationFeature {
  /**
   * delete data from the table: "OrganizationFeature"
   */
  delete_OrganizationFeature: DeleteOrganizationFeature_delete_OrganizationFeature | null;
}

export interface DeleteOrganizationFeatureVariables {
  organizationId: number;
  feature: OrganizationFeatureOption_enum;
}
