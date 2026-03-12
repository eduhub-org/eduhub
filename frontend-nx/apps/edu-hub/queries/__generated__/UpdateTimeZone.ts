/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateTimeZone
// ====================================================

export interface UpdateTimeZone_update_AppSettings_by_pk {
  __typename: "AppSettings";
  /**
   * Name of the app to which the given settings are applied
   */
  appName: string;
  timeZone: string;
}

export interface UpdateTimeZone {
  /**
   * update single row of the table: "AppSettings"
   */
  update_AppSettings_by_pk: UpdateTimeZone_update_AppSettings_by_pk | null;
}

export interface UpdateTimeZoneVariables {
  appName: string;
  value: string;
}
