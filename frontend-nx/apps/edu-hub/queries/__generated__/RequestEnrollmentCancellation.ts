/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: RequestEnrollmentCancellation
// ====================================================

export interface RequestEnrollmentCancellation_update_CourseEnrollment {
  __typename: "CourseEnrollment_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
}

export interface RequestEnrollmentCancellation {
  /**
   * update data of the table: "CourseEnrollment"
   */
  update_CourseEnrollment: RequestEnrollmentCancellation_update_CourseEnrollment | null;
}

export interface RequestEnrollmentCancellationVariables {
  enrollmentId: number;
  requestedAt: any;
  reason?: string | null;
}
