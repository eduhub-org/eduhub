/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProgramMatrixInstructorRoom
// ====================================================

export interface UpdateProgramMatrixInstructorRoom_update_Program_by_pk {
  __typename: "Program";
  id: number;
  /**
   * Matrix room id for the program-wide instructor Element chat (!room:server); invites are sent via admin API.
   */
  matrixInstructorRoomId: string | null;
}

export interface UpdateProgramMatrixInstructorRoom {
  /**
   * update single row of the table: "Program"
   */
  update_Program_by_pk: UpdateProgramMatrixInstructorRoom_update_Program_by_pk | null;
}

export interface UpdateProgramMatrixInstructorRoomVariables {
  itemId: number;
  text?: string | null;
}
