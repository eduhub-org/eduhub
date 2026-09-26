/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: InsertProgramSession
// ====================================================

export interface InsertProgramSession_insert_Session_one {
  __typename: "Session";
  id: number;
}

export interface InsertProgramSession {
  /**
   * insert a single row into the table: "Session"
   */
  insert_Session_one: InsertProgramSession_insert_Session_one | null;
}

export interface InsertProgramSessionVariables {
  programId: number;
  startTime: any;
  endTime: any;
}
