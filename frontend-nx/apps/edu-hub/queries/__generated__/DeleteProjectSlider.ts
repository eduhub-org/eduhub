/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteProjectSlider
// ====================================================

export interface DeleteProjectSlider_delete_CourseGroupOption_by_pk {
  __typename: "CourseGroupOption";
  id: number;
}

export interface DeleteProjectSlider {
  delete_CourseGroupOption_by_pk: DeleteProjectSlider_delete_CourseGroupOption_by_pk | null;
}

export interface DeleteProjectSliderVariables {
  id: number;
}
