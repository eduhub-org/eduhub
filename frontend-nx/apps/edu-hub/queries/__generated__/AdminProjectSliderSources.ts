/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: AdminProjectSliderSources
// ====================================================

export interface AdminProjectSliderSources_CourseGroupOption {
  __typename: "CourseGroupOption";
  id: number;
  title: string;
}

export interface AdminProjectSliderSources_ProjectGroupOption {
  __typename: "ProjectGroupOption";
  id: number;
  title: string;
}

export interface AdminProjectSliderSources {
  /**
   * fetch data from the table: "CourseGroupOption"
   */
  CourseGroupOption: AdminProjectSliderSources_CourseGroupOption[];
  /**
   * fetch data from the table: "ProjectGroupOption"
   */
  ProjectGroupOption: AdminProjectSliderSources_ProjectGroupOption[];
}
