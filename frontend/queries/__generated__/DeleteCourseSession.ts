/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteCourseSession
// ====================================================

export interface DeleteCourseSession_delete_Session_by_pk {
  __typename: "Session";
  id: number;
}

export interface DeleteCourseSession {
  /**
   * delete single row from the table: "Session"
   */
  delete_Session_by_pk: DeleteCourseSession_delete_Session_by_pk | null;
}

export interface DeleteCourseSessionVariables {
  sessionId: number;
}
