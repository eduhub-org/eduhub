/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UnlockCourseInstructorPayment
// ====================================================

export interface UnlockCourseInstructorPayment_update_CourseInstructorPayment {
  __typename: "CourseInstructorPayment_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
}

export interface UnlockCourseInstructorPayment {
  /**
   * update data of the table: "CourseInstructorPayment"
   */
  update_CourseInstructorPayment: UnlockCourseInstructorPayment_update_CourseInstructorPayment | null;
}

export interface UnlockCourseInstructorPaymentVariables {
  courseId: number;
}
