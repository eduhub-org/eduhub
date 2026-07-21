/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: InsertJobSlider
// ====================================================

export interface InsertJobSlider_insert_CourseGroupOption_one {
  __typename: "CourseGroupOption";
  id: number;
  title: string;
}

export interface InsertJobSlider {
  /**
   * insert a single row into the table: "CourseGroupOption"
   */
  insert_CourseGroupOption_one: InsertJobSlider_insert_CourseGroupOption_one | null;
}

export interface InsertJobSliderVariables {
  title: string;
  order: number;
}
