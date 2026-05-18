/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: MyManageableOrganizationAdmins
// ====================================================

export interface MyManageableOrganizationAdmins_OrganizationAdmin_Organization {
  __typename: "Organization";
  id: number;
  name: string;
}

export interface MyManageableOrganizationAdmins_OrganizationAdmin {
  __typename: "OrganizationAdmin";
  organizationId: number;
  Organization: MyManageableOrganizationAdmins_OrganizationAdmin_Organization;
}

export interface MyManageableOrganizationAdmins {
  OrganizationAdmin: MyManageableOrganizationAdmins_OrganizationAdmin[];
}

export interface MyManageableOrganizationAdminsVariables {
  userId: string;
}
