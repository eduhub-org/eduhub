/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: InsertProjectSlider
// ====================================================

export interface InsertProjectSlider_insert_CourseGroupOption_one {
  __typename: "CourseGroupOption";
  id: number;
  title: string;
}

export interface InsertProjectSlider {
  insert_CourseGroupOption_one: InsertProjectSlider_insert_CourseGroupOption_one | null;
}

export interface InsertProjectSliderVariables {
  title: string;
  order: number;
}
