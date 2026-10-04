/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: HomepageHero
// ====================================================

export interface HomepageHero_AppSettings {
  __typename: "AppSettings";
  /**
   * Name of the app to which the given settings are applied
   */
  appName: string;
  /**
   * German homepage hero headline as Markdown: **bold** marks the emphasised words, each line break starts a new line. NULL falls back to the built-in translation.
   */
  heroHeadlineDe: string | null;
  /**
   * English homepage hero headline as Markdown: **bold** marks the emphasised words, each line break starts a new line. NULL falls back to the built-in translation.
   */
  heroHeadlineEn: string | null;
}

export interface HomepageHero {
  /**
   * fetch data from the table: "AppSettings"
   */
  AppSettings: HomepageHero_AppSettings[];
}

export interface HomepageHeroVariables {
  appName: string;
}
