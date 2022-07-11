/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateSessionEndTime
// ====================================================

export interface UpdateSessionEndTime_update_Session_by_pk {
  __typename: "Session";
  id: number;
}

export interface UpdateSessionEndTime {
  /**
   * update single row of the table: "Session"
   */
  update_Session_by_pk: UpdateSessionEndTime_update_Session_by_pk | null;
}

export interface UpdateSessionEndTimeVariables {
  sessionId: number;
  endTime: any;
}
