/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateCourseGroupOptionOrder
// ====================================================

export interface UpdateCourseGroupOptionOrder_update_CourseGroupOption_by_pk {
  __typename: "CourseGroupOption";
  id: number;
  order: number;
}

export interface UpdateCourseGroupOptionOrder {
  /**
   * update single row of the table: "CourseGroupOption"
   */
  update_CourseGroupOption_by_pk: UpdateCourseGroupOptionOrder_update_CourseGroupOption_by_pk | null;
}

export interface UpdateCourseGroupOptionOrderVariables {
  id: number;
  order: number;
}
