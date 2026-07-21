/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: AdminProjectSliders
// ====================================================

export interface AdminProjectSliders_CourseGroupOption_SelectedCourseGroups {
  __typename: "ProjectSliderCourseGroup";
  id: number;
  courseGroupOptionId: number;
}

export interface AdminProjectSliders_CourseGroupOption_SelectedProjectGroups {
  __typename: "ProjectSliderProjectGroup";
  id: number;
  projectGroupOptionId: number;
}

export interface AdminProjectSliders_CourseGroupOption {
  __typename: "CourseGroupOption";
  id: number;
  title: string;
  order: number;
  /**
   * Indicates whether this group option is used in UI sliders (true) or as metadata tags (false)
   */
  sliderGroup: boolean | null;
  /**
   * An array relationship
   */
  SelectedCourseGroups: AdminProjectSliders_CourseGroupOption_SelectedCourseGroups[];
  /**
   * An array relationship
   */
  SelectedProjectGroups: AdminProjectSliders_CourseGroupOption_SelectedProjectGroups[];
}

export interface AdminProjectSliders {
  /**
   * fetch data from the table: "CourseGroupOption"
   */
  CourseGroupOption: AdminProjectSliders_CourseGroupOption[];
}
