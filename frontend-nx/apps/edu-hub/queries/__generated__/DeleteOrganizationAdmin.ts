/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteOrganizationAdmin
// ====================================================

export interface DeleteOrganizationAdmin_delete_OrganizationAdmin_by_pk_User {
  __typename: "User";
  id: any;
  /**
   * The user's first name
   */
  firstName: string;
  /**
   * The user's last name
   */
  lastName: string;
}

export interface DeleteOrganizationAdmin_delete_OrganizationAdmin_by_pk_Organization {
  __typename: "Organization";
  id: number;
  name: string;
}

export interface DeleteOrganizationAdmin_delete_OrganizationAdmin_by_pk {
  __typename: "OrganizationAdmin";
  id: number;
  /**
   * An object relationship
   */
  User: DeleteOrganizationAdmin_delete_OrganizationAdmin_by_pk_User;
  /**
   * An object relationship
   */
  Organization: DeleteOrganizationAdmin_delete_OrganizationAdmin_by_pk_Organization;
}

export interface DeleteOrganizationAdmin {
  /**
   * delete single row from the table: "OrganizationAdmin"
   */
  delete_OrganizationAdmin_by_pk: DeleteOrganizationAdmin_delete_OrganizationAdmin_by_pk | null;
}

export interface DeleteOrganizationAdminVariables {
  id: number;
}
