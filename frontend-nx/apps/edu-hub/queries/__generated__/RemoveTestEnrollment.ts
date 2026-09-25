/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: RemoveTestEnrollment
// ====================================================

export interface RemoveTestEnrollment_removeTestEnrollment {
  __typename: "TestEnrollmentResult";
  success: boolean;
  messageKey: string;
  enrollmentId: number | null;
}

export interface RemoveTestEnrollment {
  /**
   * Removes the caller's preview enrollment on a course they instruct, together with anything it authored (project authorships, orphaned projects, attendances)
   */
  removeTestEnrollment: RemoveTestEnrollment_removeTestEnrollment;
}

export interface RemoveTestEnrollmentVariables {
  courseId: number;
}
