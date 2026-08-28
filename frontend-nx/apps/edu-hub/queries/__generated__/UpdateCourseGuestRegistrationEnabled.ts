/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateCourseGuestRegistrationEnabled
// ====================================================

export interface UpdateCourseGuestRegistrationEnabled_update_Course_by_pk {
  __typename: "Course";
  id: number;
  /**
   * Whether visitors without an account may register for this course/event with just name and email. Only honoured for courses in a Program of type EVENTS with a direct registration type.
   */
  guestRegistrationEnabled: boolean;
}

export interface UpdateCourseGuestRegistrationEnabled {
  /**
   * update single row of the table: "Course"
   */
  update_Course_by_pk: UpdateCourseGuestRegistrationEnabled_update_Course_by_pk | null;
}

export interface UpdateCourseGuestRegistrationEnabledVariables {
  courseId: number;
  value: boolean;
}
