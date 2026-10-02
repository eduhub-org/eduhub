/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: CancelEnrollmentsByOrganizer
// ====================================================

export interface CancelEnrollmentsByOrganizer_update_CourseEnrollment {
  __typename: "CourseEnrollment_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
}

export interface CancelEnrollmentsByOrganizer {
  /**
   * update data of the table: "CourseEnrollment"
   */
  update_CourseEnrollment: CancelEnrollmentsByOrganizer_update_CourseEnrollment | null;
}

export interface CancelEnrollmentsByOrganizerVariables {
  enrollmentIds: number[];
  courseId: number;
}
