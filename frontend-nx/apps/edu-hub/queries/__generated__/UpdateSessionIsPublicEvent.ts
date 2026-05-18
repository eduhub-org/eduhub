/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateSessionIsPublicEvent
// ====================================================

export interface UpdateSessionIsPublicEvent_update_Session_by_pk {
  __typename: "Session";
  id: number;
  isPublicEvent: boolean;
}

export interface UpdateSessionIsPublicEvent {
  /**
   * update single row of the table: "Session"
   */
  update_Session_by_pk: UpdateSessionIsPublicEvent_update_Session_by_pk | null;
}

export interface UpdateSessionIsPublicEventVariables {
  sessionId: number;
  value: boolean;
}
