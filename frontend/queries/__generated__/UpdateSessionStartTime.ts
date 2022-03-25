/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateSessionStartTime
// ====================================================

export interface UpdateSessionStartTime_update_Session_by_pk {
  __typename: "Session";
  id: number;
}

export interface UpdateSessionStartTime {
  /**
   * update single row of the table: "Session"
   */
  update_Session_by_pk: UpdateSessionStartTime_update_Session_by_pk | null;
}

export interface UpdateSessionStartTimeVariables {
  sessionId: number;
  startTime: any;
}
