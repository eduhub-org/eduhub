/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateMatrixChatEnabled
// ====================================================

export interface UpdateMatrixChatEnabled_update_AppSettings_by_pk {
  __typename: "AppSettings";
  /**
   * Name of the app to which the given settings are applied
   */
  appName: string;
  /**
   * Whether course pages show the embedded Matrix course chat to participants and instructors.
   */
  matrixChatEnabled: boolean;
}

export interface UpdateMatrixChatEnabled {
  /**
   * update single row of the table: "AppSettings"
   */
  update_AppSettings_by_pk: UpdateMatrixChatEnabled_update_AppSettings_by_pk | null;
}

export interface UpdateMatrixChatEnabledVariables {
  appName: string;
  value: boolean;
}
