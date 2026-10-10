/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpsertCourseInstructorPaymentShare
// ====================================================

export interface UpsertCourseInstructorPaymentShare_insert_CourseInstructorPaymentShare_one {
  __typename: "CourseInstructorPaymentShare";
  id: number;
  /**
   * Share of the course fee in cents.
   */
  amount: number;
}

export interface UpsertCourseInstructorPaymentShare {
  /**
   * insert a single row into the table: "CourseInstructorPaymentShare"
   */
  insert_CourseInstructorPaymentShare_one: UpsertCourseInstructorPaymentShare_insert_CourseInstructorPaymentShare_one | null;
}

export interface UpsertCourseInstructorPaymentShareVariables {
  courseInstructorId: number;
  amount: number;
}
