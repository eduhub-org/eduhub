/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteSession
// ====================================================

export interface DeleteSession_delete_Session_by_pk {
  __typename: "Session";
  id: number;
}

export interface DeleteSession {
  /**
   * delete single row from the table: "Session"
   */
  delete_Session_by_pk: DeleteSession_delete_Session_by_pk | null;
}

export interface DeleteSessionVariables {
  sessionId: number;
}
