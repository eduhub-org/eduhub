/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: SendSessionReminders
// ====================================================

export interface SendSessionReminders_sendSessionReminders_processedSessions {
  __typename: "ProcessedSession";
  sessionId: number;
  sessionTitle: string;
  reminderType: string;
  emailsSent: number;
}

export interface SendSessionReminders_sendSessionReminders {
  __typename: "SendSessionRemindersResult";
  success: boolean;
  messageKey: string;
  error: string | null;
  totalEmailsSent: number | null;
  processedSessions: SendSessionReminders_sendSessionReminders_processedSessions[] | null;
  processedAt: string | null;
}

export interface SendSessionReminders {
  sendSessionReminders: SendSessionReminders_sendSessionReminders;
}
