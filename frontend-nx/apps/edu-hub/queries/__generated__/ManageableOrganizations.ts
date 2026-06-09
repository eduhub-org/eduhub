/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: ManageableOrganizations
// ====================================================

export interface ManageableOrganizations_OrganizationAdmin_Organization {
  __typename: "Organization";
  id: number;
  name: string;
}

export interface ManageableOrganizations_OrganizationAdmin {
  __typename: "OrganizationAdmin";
  organizationId: number;
  /**
   * An object relationship
   */
  Organization: ManageableOrganizations_OrganizationAdmin_Organization;
}

export interface ManageableOrganizations {
  /**
   * fetch data from the table: "OrganizationAdmin"
   */
  OrganizationAdmin: ManageableOrganizations_OrganizationAdmin[];
}
