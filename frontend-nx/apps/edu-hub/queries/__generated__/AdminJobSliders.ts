/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { JobPostingType_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: AdminJobSliders
// ====================================================

export interface AdminJobSliders_CourseGroupOption_SelectedJobTypes {
  __typename: "JobSliderJobType";
  id: number;
  jobType: JobPostingType_enum;
}

export interface AdminJobSliders_CourseGroupOption {
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
  SelectedJobTypes: AdminJobSliders_CourseGroupOption_SelectedJobTypes[];
}

export interface AdminJobSliders {
  /**
   * fetch data from the table: "CourseGroupOption"
   */
  CourseGroupOption: AdminJobSliders_CourseGroupOption[];
}
