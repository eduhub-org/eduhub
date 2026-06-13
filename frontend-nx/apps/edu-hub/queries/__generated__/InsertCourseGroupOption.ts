/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: InsertCourseGroupOption
// ====================================================

export interface InsertCourseGroupOption_insert_CourseGroupOption_one {
  __typename: "CourseGroupOption";
  id: number;
  title: string;
  order: number;
  /**
   * Indicates whether this group option is used in UI sliders (true) or as metadata tags (false)
   */
  sliderGroup: boolean | null;
}

export interface InsertCourseGroupOption {
  /**
   * insert a single row into the table: "CourseGroupOption"
   */
  insert_CourseGroupOption_one: InsertCourseGroupOption_insert_CourseGroupOption_one | null;
}

export interface InsertCourseGroupOptionVariables {
  title: string;
  order: number;
  sliderGroup: boolean;
}
