/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CourseRegistrationType_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateCourseRegistrationType
// ====================================================

export interface UpdateCourseRegistrationType_update_Course_by_pk {
  __typename: "Course";
  id: number;
  registrationType: CourseRegistrationType_enum | null;
}

export interface UpdateCourseRegistrationType {
  /**
   * update single row of the table: "Course"
   */
  update_Course_by_pk: UpdateCourseRegistrationType_update_Course_by_pk | null;
}

export interface UpdateCourseRegistrationTypeVariables {
  itemId: number;
  value: CourseRegistrationType_enum;
}
