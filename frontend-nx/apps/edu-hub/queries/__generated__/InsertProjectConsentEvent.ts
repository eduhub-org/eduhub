/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: InsertProjectConsentEvent
// ====================================================

export interface InsertProjectConsentEvent_insert_ProjectConsentEvent_one {
  __typename: "ProjectConsentEvent";
  id: number;
  eventType: string;
  created_at: any;
  termsVersion: string;
}

export interface InsertProjectConsentEvent {
  /**
   * insert a single row into the table: "ProjectConsentEvent"
   */
  insert_ProjectConsentEvent_one: InsertProjectConsentEvent_insert_ProjectConsentEvent_one | null;
}

export interface InsertProjectConsentEventVariables {
  projectId: number;
  eventType: string;
  termsVersion: string;
}
