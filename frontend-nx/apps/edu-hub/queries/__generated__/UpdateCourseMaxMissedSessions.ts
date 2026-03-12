/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateCourseMaxMissedSessions
// ====================================================

export interface UpdateCourseMaxMissedSessions_update_Course_by_pk {
  __typename: "Course";
  id: number;
  /**
   * The maximum number of sessions a participant can miss while still receiving a certificate
   */
  maxMissedSessions: number;
}

export interface UpdateCourseMaxMissedSessions {
  /**
   * update single row of the table: "Course"
   */
  update_Course_by_pk: UpdateCourseMaxMissedSessions_update_Course_by_pk | null;
}

export interface UpdateCourseMaxMissedSessionsVariables {
  itemId: number;
  text: number;
}
