/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpsertCourseInstructorPaymentTotal
// ====================================================

export interface UpsertCourseInstructorPaymentTotal_insert_CourseInstructorPayment_one {
  __typename: "CourseInstructorPayment";
  id: number;
  /**
   * Total instructor fee for the course in cents (e.g. 50000 = €500.00).
   */
  totalAmount: number;
}

export interface UpsertCourseInstructorPaymentTotal {
  /**
   * insert a single row into the table: "CourseInstructorPayment"
   */
  insert_CourseInstructorPayment_one: UpsertCourseInstructorPaymentTotal_insert_CourseInstructorPayment_one | null;
}

export interface UpsertCourseInstructorPaymentTotalVariables {
  courseId: number;
  totalAmount: number;
}
