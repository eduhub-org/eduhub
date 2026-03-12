/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateFaqVisibility
// ====================================================

export interface UpdateFaqVisibility_update_AppSettings_by_pk {
  __typename: "AppSettings";
  /**
   * Name of the app to which the given settings are applied
   */
  appName: string;
  showFaqSection: boolean;
  faqCollectionName: string;
}

export interface UpdateFaqVisibility {
  /**
   * update single row of the table: "AppSettings"
   */
  update_AppSettings_by_pk: UpdateFaqVisibility_update_AppSettings_by_pk | null;
}

export interface UpdateFaqVisibilityVariables {
  appName: string;
  value: boolean;
}
