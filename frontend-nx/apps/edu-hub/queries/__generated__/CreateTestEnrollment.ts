/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: CreateTestEnrollment
// ====================================================

export interface CreateTestEnrollment_createTestEnrollment {
  __typename: "TestEnrollmentResult";
  success: boolean;
  messageKey: string;
  enrollmentId: number | null;
}

export interface CreateTestEnrollment {
  /**
   * Creates a hidden preview enrollment (CourseEnrollment.isTest) for the caller on a course they instruct, so they can see the participant view of it
   */
  createTestEnrollment: CreateTestEnrollment_createTestEnrollment;
}

export interface CreateTestEnrollmentVariables {
  courseId: number;
}
