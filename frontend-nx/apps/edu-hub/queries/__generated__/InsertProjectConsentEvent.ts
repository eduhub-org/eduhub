/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation: InsertProjectConsentEvent
// ====================================================

export interface InsertProjectConsentEvent_insert_ProjectConsentEvent_one {
  __typename: "ProjectConsentEvent";
  id: number;
  event_type: string;
  created_at: any;
  terms_version: string;
}

export interface InsertProjectConsentEvent {
  insert_ProjectConsentEvent_one: InsertProjectConsentEvent_insert_ProjectConsentEvent_one | null;
}

export interface InsertProjectConsentEventVariables {
  projectId: number;
  eventType: string;
  termsVersion: string;
}
