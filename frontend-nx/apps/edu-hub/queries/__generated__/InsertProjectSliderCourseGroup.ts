/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: InsertProjectSliderCourseGroup
// ====================================================

export interface InsertProjectSliderCourseGroup_insert_ProjectSliderCourseGroup_one {
  __typename: "ProjectSliderCourseGroup";
  id: number;
}

export interface InsertProjectSliderCourseGroup {
  /**
   * insert a single row into the table: "ProjectSliderCourseGroup"
   */
  insert_ProjectSliderCourseGroup_one: InsertProjectSliderCourseGroup_insert_ProjectSliderCourseGroup_one | null;
}

export interface InsertProjectSliderCourseGroupVariables {
  projectSliderOptionId: number;
  courseGroupOptionId: number;
}
