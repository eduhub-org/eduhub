/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateSessionIsMandatory
// ====================================================

export interface UpdateSessionIsMandatory_update_Session_by_pk {
  __typename: "Session";
  id: number;
  /**
   * If false, attendance is tracked but does not count toward passing (maxMissedSessions) or certificates
   */
  isMandatory: boolean;
}

export interface UpdateSessionIsMandatory {
  /**
   * update single row of the table: "Session"
   */
  update_Session_by_pk: UpdateSessionIsMandatory_update_Session_by_pk | null;
}

export interface UpdateSessionIsMandatoryVariables {
  sessionId: number;
  value: boolean;
}
