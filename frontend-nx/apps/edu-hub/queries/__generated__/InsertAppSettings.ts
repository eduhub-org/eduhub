/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: InsertAppSettings
// ====================================================

export interface InsertAppSettings_insert_AppSettings_one {
  __typename: "AppSettings";
  id: number;
}

export interface InsertAppSettings {
  /**
   * insert a single row into the table: "AppSettings"
   */
  insert_AppSettings_one: InsertAppSettings_insert_AppSettings_one | null;
}

export interface InsertAppSettingsVariables {
  bannerBackgroundColor?: string | null;
  bannerFontColor?: string | null;
  bannerTextDe?: string | null;
  bannerTextEn?: string | null;
}
