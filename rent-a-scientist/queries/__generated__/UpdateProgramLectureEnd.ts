/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProgramLectureEnd
// ====================================================

export interface UpdateProgramLectureEnd_update_Program_by_pk {
  __typename: "Program";
  id: number;
}

export interface UpdateProgramLectureEnd {
  /**
   * update single row of the table: "Program"
   */
  update_Program_by_pk: UpdateProgramLectureEnd_update_Program_by_pk | null;
}

export interface UpdateProgramLectureEndVariables {
  programId: number;
  lectureEnd: any;
}
