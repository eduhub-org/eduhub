/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { JobPostingType_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: CourseGroupOptions
// ====================================================

export interface CourseGroupOptions_CourseGroupOption_SelectedCourseGroups {
  __typename: "ProjectSliderCourseGroup";
  id: number;
  courseGroupOptionId: number;
}

export interface CourseGroupOptions_CourseGroupOption_SelectedProjectGroups {
  __typename: "ProjectSliderProjectGroup";
  id: number;
  projectGroupOptionId: number;
}

export interface CourseGroupOptions_CourseGroupOption_SelectedJobTypes {
  __typename: "JobSliderJobType";
  id: number;
  /**
   * The JobPostingType value this job slider pulls postings from.
   */
  jobType: JobPostingType_enum;
}

export interface CourseGroupOptions_CourseGroupOption {
  __typename: "CourseGroupOption";
  id: number;
  order: number;
  title: string;
  /**
   * Indicates whether this group option is used in UI sliders (true) or as metadata tags (false)
   */
  sliderGroup: boolean | null;
  /**
   * Whether this slider row renders courses (COURSE, default), projects (PROJECT) or jobs (JOB). PROJECT rows compose their membership from the ProjectSliderCourseGroup / ProjectSliderProjectGroup selections. JOB rows compose their membership from the JobSliderJobType selections.
   */
  contentType: string;
  /**
   * When set, this group automatically includes all published courses of the given program type (e.g. COURSES, EVENTS, DEGREES) instead of relying on manual CourseGroup assignments.
   */
  programType: string | null;
  /**
   * When set, this group is owned by the given organization. Organization-owned groups are not shown on the public homepage but can be selected in that organization's course widget.
   */
  organizationId: number | null;
  /**
   * An array relationship
   */
  SelectedCourseGroups: CourseGroupOptions_CourseGroupOption_SelectedCourseGroups[];
  /**
   * An array relationship
   */
  SelectedProjectGroups: CourseGroupOptions_CourseGroupOption_SelectedProjectGroups[];
  /**
   * An array relationship
   */
  SelectedJobTypes: CourseGroupOptions_CourseGroupOption_SelectedJobTypes[];
}

export interface CourseGroupOptions {
  /**
   * fetch data from the table: "CourseGroupOption"
   */
  CourseGroupOption: CourseGroupOptions_CourseGroupOption[];
}
