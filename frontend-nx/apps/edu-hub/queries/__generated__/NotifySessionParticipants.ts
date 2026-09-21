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
  notifySessionParticipants: NotifySessionParticipants_notifySessionParticipants;
}

export interface NotifySessionParticipantsVariables {
  sessionId: number;
}
