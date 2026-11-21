/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: ExpertNoteOrganizations
// ====================================================

export interface ExpertNoteOrganizations_OrganizationAdmin_Organization {
  __typename: "Organization";
  id: number;
  name: string;
}

export interface ExpertNoteOrganizations_OrganizationAdmin {
  __typename: "OrganizationAdmin";
  id: number;
  organizationId: number;
  /**
   * An object relationship
   */
  Organization: ExpertNoteOrganizations_OrganizationAdmin_Organization;
}

export interface ExpertNoteOrganizations {
  /**
   * fetch data from the table: "OrganizationAdmin"
   */
  OrganizationAdmin: ExpertNoteOrganizations_OrganizationAdmin[];
}

export interface ExpertNoteOrganizationsVariables {
  userId: any;
}
