/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: AdminHomeSliderOrganizations
// ====================================================

export interface AdminHomeSliderOrganizations_HomeSliderOrganization_Organization {
  __typename: "Organization";
  id: number;
  name: string;
}

export interface AdminHomeSliderOrganizations_HomeSliderOrganization {
  __typename: "HomeSliderOrganization";
  id: number;
  organizationId: number;
  /**
   * An object relationship
   */
  Organization: AdminHomeSliderOrganizations_HomeSliderOrganization_Organization;
}

export interface AdminHomeSliderOrganizations {
  /**
   * fetch data from the table: "HomeSliderOrganization"
   */
  HomeSliderOrganization: AdminHomeSliderOrganizations_HomeSliderOrganization[];
}
