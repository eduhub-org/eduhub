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
  /**
   * When true, this session is promoted as a standalone public event. Anonymous users can view a dedicated public detail page at /event/[sessionId] and the session can appear in events sliders. Only admins can toggle this flag; instructors can read but not write it.
   */
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
  isPublicEvent: boolean;
}
