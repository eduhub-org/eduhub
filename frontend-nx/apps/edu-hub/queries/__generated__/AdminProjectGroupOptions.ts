/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: AdminProjectGroupOptions
// ====================================================

export interface AdminProjectGroupOptions_ProjectGroupOption_ProjectGroups_aggregate_aggregate {
  __typename: "ProjectGroup_aggregate_fields";
  count: number;
}

export interface AdminProjectGroupOptions_ProjectGroupOption_ProjectGroups_aggregate {
  __typename: "ProjectGroup_aggregate";
  aggregate: AdminProjectGroupOptions_ProjectGroupOption_ProjectGroups_aggregate_aggregate | null;
}

export interface AdminProjectGroupOptions_ProjectGroupOption_ProjectSliderProjectGroups_aggregate_aggregate {
  __typename: "ProjectSliderProjectGroup_aggregate_fields";
  count: number;
}

export interface AdminProjectGroupOptions_ProjectGroupOption_ProjectSliderProjectGroups_aggregate {
  __typename: "ProjectSliderProjectGroup_aggregate";
  aggregate: AdminProjectGroupOptions_ProjectGroupOption_ProjectSliderProjectGroups_aggregate_aggregate | null;
}

export interface AdminProjectGroupOptions_ProjectGroupOption {
  __typename: "ProjectGroupOption";
  id: number;
  order: number;
  title: string;
  organizationId: number | null;
  ProjectGroups_aggregate: AdminProjectGroupOptions_ProjectGroupOption_ProjectGroups_aggregate;
  ProjectSliderProjectGroups_aggregate: AdminProjectGroupOptions_ProjectGroupOption_ProjectSliderProjectGroups_aggregate;
}

export interface AdminProjectGroupOptions {
  ProjectGroupOption: AdminProjectGroupOptions_ProjectGroupOption[];
}
