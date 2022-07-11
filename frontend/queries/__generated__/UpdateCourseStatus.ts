/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CourseStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateCourseStatus
// ====================================================

export interface UpdateCourseStatus_update_Course_by_pk {
  __typename: "Course";
  id: number;
}

export interface UpdateCourseStatus {
  /**
   * update single row of the table: "Course"
   */
  update_Course_by_pk: UpdateCourseStatus_update_Course_by_pk | null;
}

export interface UpdateCourseStatusVariables {
  courseId: number;
  status: CourseStatus_enum;
}
