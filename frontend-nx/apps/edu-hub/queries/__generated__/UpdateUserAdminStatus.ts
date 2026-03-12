/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateUserAdminStatus
// ====================================================

export interface UpdateUserAdminStatus_updateUserAdminStatus {
  __typename: "UpdateAdminStatusResult";
  success: boolean;
  error: string | null;
  messageKey: string;
}

export interface UpdateUserAdminStatus {
  updateUserAdminStatus: UpdateUserAdminStatus_updateUserAdminStatus;
}

export interface UpdateUserAdminStatusVariables {
  userId: string;
  isAdmin: boolean;
}
