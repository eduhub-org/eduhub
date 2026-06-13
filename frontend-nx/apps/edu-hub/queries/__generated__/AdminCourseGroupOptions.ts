/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: AdminCourseGroupOptions
// ====================================================

export interface AdminCourseGroupOptions_CourseGroupOption_CourseGroups_aggregate_aggregate {
  __typename: "CourseGroup_aggregate_fields";
  count: number;
}

export interface AdminCourseGroupOptions_CourseGroupOption_CourseGroups_aggregate {
  __typename: "CourseGroup_aggregate";
  aggregate: AdminCourseGroupOptions_CourseGroupOption_CourseGroups_aggregate_aggregate | null;
}

export interface AdminCourseGroupOptions_CourseGroupOption {
  __typename: "CourseGroupOption";
  id: number;
  order: number;
  title: string;
  /**
   * Indicates whether this group option is used in UI sliders (true) or as metadata tags (false)
   */
  sliderGroup: boolean | null;
  /**
   * When set, this group automatically includes all published courses of the given program type (e.g. COURSES, EVENTS, DEGREES) instead of relying on manual CourseGroup assignments.
   */
  programType: string | null;
  /**
   * When set, this group is owned by the given organization. Organization-owned groups are not shown on the public homepage but can be selected in that organization's course widget.
   */
  organizationId: number | null;
  /**
   * An aggregate relationship
   */
  CourseGroups_aggregate: AdminCourseGroupOptions_CourseGroupOption_CourseGroups_aggregate;
}

export interface AdminCourseGroupOptions {
  /**
   * fetch data from the table: "CourseGroupOption"
   */
  CourseGroupOption: AdminCourseGroupOptions_CourseGroupOption[];
}
