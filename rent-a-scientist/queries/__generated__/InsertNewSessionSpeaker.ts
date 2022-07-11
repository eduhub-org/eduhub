/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: InsertNewSessionSpeaker
// ====================================================

export interface InsertNewSessionSpeaker_insert_SessionSpeaker_returning {
  __typename: "SessionSpeaker";
  id: number;
}

export interface InsertNewSessionSpeaker_insert_SessionSpeaker {
  __typename: "SessionSpeaker_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
  /**
   * data from the rows affected by the mutation
   */
  returning: InsertNewSessionSpeaker_insert_SessionSpeaker_returning[];
}

export interface InsertNewSessionSpeaker {
  /**
   * insert data into the table: "SessionSpeaker"
   */
  insert_SessionSpeaker: InsertNewSessionSpeaker_insert_SessionSpeaker | null;
}

export interface InsertNewSessionSpeakerVariables {
  sessionId: number;
  expertId: number;
}
