/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProgramLectureStart
// ====================================================

export interface UpdateProgramLectureStart_update_Program_by_pk {
  __typename: "Program";
  id: number;
}

export interface UpdateProgramLectureStart {
  /**
   * update single row of the table: "Program"
   */
  update_Program_by_pk: UpdateProgramLectureStart_update_Program_by_pk | null;
}

export interface UpdateProgramLectureStartVariables {
  programId: number;
  lectureStart: any;
}
