/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateHeroHeadline
// ====================================================

export interface UpdateHeroHeadline_update_AppSettings_by_pk {
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

export interface UpdateHeroHeadline {
  /**
   * update single row of the table: "AppSettings"
   */
  update_AppSettings_by_pk: UpdateHeroHeadline_update_AppSettings_by_pk | null;
}

export interface UpdateHeroHeadlineVariables {
  appName: string;
  heroHeadlineDe?: string | null;
  heroHeadlineEn?: string | null;
}
