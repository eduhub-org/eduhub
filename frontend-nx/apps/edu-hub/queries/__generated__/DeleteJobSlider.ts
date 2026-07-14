/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteJobSlider
// ====================================================

export interface DeleteJobSlider_delete_CourseGroupOption_by_pk {
  __typename: "CourseGroupOption";
  id: number;
}

export interface DeleteJobSlider {
  /**
   * delete single row from the table: "CourseGroupOption"
   */
  delete_CourseGroupOption_by_pk: DeleteJobSlider_delete_CourseGroupOption_by_pk | null;
}

export interface DeleteJobSliderVariables {
  id: number;
}
