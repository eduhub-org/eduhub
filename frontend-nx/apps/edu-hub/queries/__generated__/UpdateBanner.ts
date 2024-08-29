/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateBanner
// ====================================================

export interface UpdateBanner_update_AppSettings_by_pk {
  __typename: "AppSettings";
  /**
   * Name of the app to which the given settings are applied
   */
  appName: string;
  /**
   * Homepage background image
   */
  backgroundImageURL: string | null;
  /**
   * Background color for the dismissiable banner displayed on the homepage
   */
  bannerBackgroundColor: string | null;
  /**
   * Font color for the text in the dismissiable banner displayed on the homepage
   */
  bannerFontColor: string | null;
  /**
   * English version for the text of a dismissiable banner on the homepage
   */
  bannerTextEn: string | null;
  /**
   * German version for the text of a dismissiable banner on the homepage
   */
  bannerTextDe: string | null;
}

export interface UpdateBanner {
  /**
   * update single row of the table: "AppSettings"
   */
  update_AppSettings_by_pk: UpdateBanner_update_AppSettings_by_pk | null;
}

export interface UpdateBannerVariables {
  appName: string;
  bannerBackgroundColor?: string | null;
  bannerFontColor?: string | null;
  bannerTextDe?: string | null;
  bannerTextEn?: string | null;
}
