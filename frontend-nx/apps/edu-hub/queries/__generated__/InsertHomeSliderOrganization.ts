/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: InsertHomeSliderOrganization
// ====================================================

export interface InsertHomeSliderOrganization_insert_HomeSliderOrganization_one {
  __typename: "HomeSliderOrganization";
  id: number;
}

export interface InsertHomeSliderOrganization {
  /**
   * insert a single row into the table: "HomeSliderOrganization"
   */
  insert_HomeSliderOrganization_one: InsertHomeSliderOrganization_insert_HomeSliderOrganization_one | null;
}

export interface InsertHomeSliderOrganizationVariables {
  organizationId: number;
}
