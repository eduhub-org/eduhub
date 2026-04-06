/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: SyncProgramInstructorMatrixRoom
// ====================================================

export interface SyncProgramInstructorMatrixRoom_syncProgramInstructorMatrixRoom {
  __typename: "SyncProgramInstructorMatrixRoomResult";
  success: boolean;
  messageKey: string;
  invitedCount: number | null;
  skippedCount: number | null;
  details: string | null;
  error: string | null;
}

export interface SyncProgramInstructorMatrixRoom {
  /**
   * Invites all program course instructors to the configured Matrix instructor room
   */
  syncProgramInstructorMatrixRoom: SyncProgramInstructorMatrixRoom_syncProgramInstructorMatrixRoom;
}

export interface SyncProgramInstructorMatrixRoomVariables {
  programId: number;
}
