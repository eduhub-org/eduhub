/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: InsertSession
// ====================================================

export interface InsertSession_insert_Session_returning {
  __typename: "Session";
  id: number;
}

export interface InsertSession_insert_Session {
  __typename: "Session_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
  /**
   * data from the rows affected by the mutation
   */
  returning: InsertSession_insert_Session_returning[];
}

export interface InsertSession {
  /**
   * insert data into the table: "Session"
   */
  insert_Session: InsertSession_insert_Session | null;
}

export interface InsertSessionVariables {
  courseId: number;
  startTime: any;
  endTime: any;
}
