/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteSessionSpeaker
// ====================================================

export interface DeleteSessionSpeaker_delete_SessionSpeaker_by_pk {
  __typename: "SessionSpeaker";
  id: number;
}

export interface DeleteSessionSpeaker {
  /**
   * delete single row from the table: "SessionSpeaker"
   */
  delete_SessionSpeaker_by_pk: DeleteSessionSpeaker_delete_SessionSpeaker_by_pk | null;
}

export interface DeleteSessionSpeakerVariables {
  speakerId: number;
}
