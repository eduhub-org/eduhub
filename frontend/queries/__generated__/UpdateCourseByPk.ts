/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { Course_set_input } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateCourseByPk
// ====================================================

export interface UpdateCourseByPk_update_Course_by_pk {
  __typename: "Course";
  id: number;
}

export interface UpdateCourseByPk {
  /**
   * update single row of the table: "Course"
   */
  update_Course_by_pk: UpdateCourseByPk_update_Course_by_pk | null;
}

export interface UpdateCourseByPkVariables {
  id: number;
  changes?: Course_set_input | null;
}
