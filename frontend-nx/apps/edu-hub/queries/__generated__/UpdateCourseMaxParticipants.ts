/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateCourseMaxParticipants
// ====================================================

export interface UpdateCourseMaxParticipants_update_Course_by_pk {
  __typename: "Course";
  id: number;
}

export interface UpdateCourseMaxParticipants {
  /**
   * update single row of the table: "Course"
   */
  update_Course_by_pk: UpdateCourseMaxParticipants_update_Course_by_pk | null;
}

export interface UpdateCourseMaxParticipantsVariables {
  itemId: number;
  text: number;
}
