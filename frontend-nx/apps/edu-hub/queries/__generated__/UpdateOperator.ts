/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateOperator
// ====================================================

export interface UpdateOperator_update_AppSettings_by_pk {
  __typename: "AppSettings";
  /**
   * Name of the app to which the given settings are applied
   */
  appName: string;
  /**
   * Display name of the organisation operating this instance, used in user-facing texts.
   */
  operatorName: string | null;
  /**
   * Email address for data protection questions and incidents.
   */
  privacyContactEmail: string | null;
}

export interface UpdateOperator {
  /**
   * update single row of the table: "AppSettings"
   */
  update_AppSettings_by_pk: UpdateOperator_update_AppSettings_by_pk | null;
}

export interface UpdateOperatorVariables {
  appName: string;
  operatorName?: string | null;
  privacyContactEmail?: string | null;
}
