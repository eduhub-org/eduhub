/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: AdminUsers
// ====================================================

export interface AdminUsers_getAdminUsers {
  __typename: "GetAdminUsersResult";
  success: boolean;
  adminUserIds: string[];
  messageKey: string;
  error: string | null;
}

export interface AdminUsers {
  getAdminUsers: AdminUsers_getAdminUsers;
}
