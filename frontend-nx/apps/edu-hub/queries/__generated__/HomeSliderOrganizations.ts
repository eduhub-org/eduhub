/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: HomeSliderOrganizations
// ====================================================

export interface HomeSliderOrganizations_HomeSliderOrganization {
  __typename: "HomeSliderOrganization";
  id: number;
  organizationId: number;
}

export interface HomeSliderOrganizations {
  /**
   * fetch data from the table: "HomeSliderOrganization"
   */
  HomeSliderOrganization: HomeSliderOrganizations_HomeSliderOrganization[];
}
