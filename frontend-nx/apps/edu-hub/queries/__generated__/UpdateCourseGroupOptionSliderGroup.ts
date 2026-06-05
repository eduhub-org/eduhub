/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateCourseGroupOptionSliderGroup
// ====================================================

export interface UpdateCourseGroupOptionSliderGroup_update_CourseGroupOption_by_pk {
  __typename: "CourseGroupOption";
  id: number;
  /**
   * Indicates whether this group option is used in UI sliders (true) or as metadata tags (false)
   */
  sliderGroup: boolean | null;
}

export interface UpdateCourseGroupOptionSliderGroup {
  /**
   * update single row of the table: "CourseGroupOption"
   */
  update_CourseGroupOption_by_pk: UpdateCourseGroupOptionSliderGroup_update_CourseGroupOption_by_pk | null;
}

export interface UpdateCourseGroupOptionSliderGroupVariables {
  id: number;
  sliderGroup: boolean;
}
