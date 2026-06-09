/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: OrganizationAdminUserByEmail
// ====================================================

export interface OrganizationAdminUserByEmail_User {
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

export interface OrganizationAdminUserByEmail {
  /**
   * fetch data from the table: "User"
   */
  User: OrganizationAdminUserByEmail_User[];
}

export interface OrganizationAdminUserByEmailVariables {
  email: string;
}
