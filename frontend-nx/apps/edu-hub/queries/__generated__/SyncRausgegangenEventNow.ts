/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: SyncRausgegangenEventNow
// ====================================================

export interface SyncRausgegangenEventNow_syncRausgegangenEventNow {
  __typename: "SyncRausgegangenEventResult";
  success: boolean;
  syncStatus: string | null;
  error: string | null;
  previewUrl: string | null;
  publicUrl: string | null;
}

export interface SyncRausgegangenEventNow {
  /**
   * Pushes an event to rausgegangen.de right away instead of waiting for the triggers.
   */
  syncRausgegangenEventNow: SyncRausgegangenEventNow_syncRausgegangenEventNow;
}

export interface SyncRausgegangenEventNowVariables {
  courseId: number;
}
