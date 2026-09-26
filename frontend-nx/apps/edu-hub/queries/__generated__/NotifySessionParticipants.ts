/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: NotifySessionParticipants
// ====================================================

export interface NotifySessionParticipants_notifySessionParticipants {
  __typename: "NotifySessionParticipantsResult";
  success: boolean;
  queued: number | null;
  total: number | null;
  error: string | null;
  messageKey: string | null;
}

export interface NotifySessionParticipants {
  /**
   * Mails active participants that a session was rescheduled. Called from the Sessions tab after the editor confirms the prompt; there is no automatic trigger any more. Authorization is in the handler, because the action queries with the admin secret and Session row permissions do not apply to it.
   */
  notifySessionParticipants: NotifySessionParticipants_notifySessionParticipants;
}

export interface NotifySessionParticipantsVariables {
  sessionId: number;
}
