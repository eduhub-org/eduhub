/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: ConfirmWaitlistEnrollment
// ====================================================

export interface ConfirmWaitlistEnrollment_update_CourseEnrollment {
  __typename: "CourseEnrollment_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
}

export interface ConfirmWaitlistEnrollment {
  /**
   * update data of the table: "CourseEnrollment"
   */
  update_CourseEnrollment: ConfirmWaitlistEnrollment_update_CourseEnrollment | null;
}

export interface ConfirmWaitlistEnrollmentVariables {
  enrollmentId: number;
  courseId: number;
}
