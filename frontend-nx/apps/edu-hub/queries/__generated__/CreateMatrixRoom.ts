/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: CreateMatrixRoom
// ====================================================

export interface CreateMatrixRoom_createMatrixRoom {
  __typename: "CreateMatrixRoomResult";
  success: boolean;
  messageKey: string;
  spaceId: string | null;
  roomId: string | null;
  chatLink: string | null;
  alreadyExists: boolean | null;
  error: string | null;
  partialSpaceId: string | null;
  partialRoomId: string | null;
}

export interface CreateMatrixRoom {
  /**
   * Creates Matrix program space and course room, then stores matrix ids in Hasura
   */
  createMatrixRoom: CreateMatrixRoom_createMatrixRoom;
}

export interface CreateMatrixRoomVariables {
  courseId: number;
  roomName: string;
  topic?: string | null;
  spaceName?: string | null;
}
