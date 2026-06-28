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
  sliderGroup: boolean | null;
  SelectedCourseGroups: AdminProjectSliders_CourseGroupOption_SelectedCourseGroups[];
  SelectedProjectGroups: AdminProjectSliders_CourseGroupOption_SelectedProjectGroups[];
}

export interface AdminProjectSliders {
  CourseGroupOption: AdminProjectSliders_CourseGroupOption[];
}
