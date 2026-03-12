/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateCourseAttendanceCertificatePossible
// ====================================================

export interface UpdateCourseAttendanceCertificatePossible_update_Course_by_pk {
  __typename: "Course";
  id: number;
}

export interface UpdateCourseAttendanceCertificatePossible {
  /**
   * update single row of the table: "Course"
   */
  update_Course_by_pk: UpdateCourseAttendanceCertificatePossible_update_Course_by_pk | null;
}

export interface UpdateCourseAttendanceCertificatePossibleVariables {
  courseId: number;
  isPossible: boolean;
}
