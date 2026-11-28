/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { Project_bool_exp } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: ProjectsOverviewStatusCounts
// ====================================================

export interface ProjectsOverviewStatusCounts_TEMPLATE_aggregate {
  __typename: "Project_aggregate_fields";
  count: number;
}

export interface ProjectsOverviewStatusCounts_TEMPLATE {
  __typename: "Project_aggregate";
  aggregate: ProjectsOverviewStatusCounts_TEMPLATE_aggregate | null;
}

export interface ProjectsOverviewStatusCounts_PROPOSED_aggregate {
  __typename: "Project_aggregate_fields";
  count: number;
}

export interface ProjectsOverviewStatusCounts_PROPOSED {
  __typename: "Project_aggregate";
  aggregate: ProjectsOverviewStatusCounts_PROPOSED_aggregate | null;
}

export interface ProjectsOverviewStatusCounts_ONGOING_aggregate {
  __typename: "Project_aggregate_fields";
  count: number;
}

export interface ProjectsOverviewStatusCounts_ONGOING {
  __typename: "Project_aggregate";
  aggregate: ProjectsOverviewStatusCounts_ONGOING_aggregate | null;
}

export interface ProjectsOverviewStatusCounts_SENT_BACK_aggregate {
  __typename: "Project_aggregate_fields";
  count: number;
}

export interface ProjectsOverviewStatusCounts_SENT_BACK {
  __typename: "Project_aggregate";
  aggregate: ProjectsOverviewStatusCounts_SENT_BACK_aggregate | null;
}

export interface ProjectsOverviewStatusCounts_SUBMITTED_aggregate {
  __typename: "Project_aggregate_fields";
  count: number;
}

export interface ProjectsOverviewStatusCounts_SUBMITTED {
  __typename: "Project_aggregate";
  aggregate: ProjectsOverviewStatusCounts_SUBMITTED_aggregate | null;
}

export interface ProjectsOverviewStatusCounts_COMPLETED_PASSED_aggregate {
  __typename: "Project_aggregate_fields";
  count: number;
}

export interface ProjectsOverviewStatusCounts_COMPLETED_PASSED {
  __typename: "Project_aggregate";
  aggregate: ProjectsOverviewStatusCounts_COMPLETED_PASSED_aggregate | null;
}

export interface ProjectsOverviewStatusCounts_SUGGESTED_FOR_PUBLICATION_aggregate {
  __typename: "Project_aggregate_fields";
  count: number;
}

export interface ProjectsOverviewStatusCounts_SUGGESTED_FOR_PUBLICATION {
  __typename: "Project_aggregate";
  aggregate: ProjectsOverviewStatusCounts_SUGGESTED_FOR_PUBLICATION_aggregate | null;
}

export interface ProjectsOverviewStatusCounts_PUBLISHED_aggregate {
  __typename: "Project_aggregate_fields";
  count: number;
}

export interface ProjectsOverviewStatusCounts_PUBLISHED {
  __typename: "Project_aggregate";
  aggregate: ProjectsOverviewStatusCounts_PUBLISHED_aggregate | null;
}

export interface ProjectsOverviewStatusCounts_INCOMPLETE_FAILED_aggregate {
  __typename: "Project_aggregate_fields";
  count: number;
}

export interface ProjectsOverviewStatusCounts_INCOMPLETE_FAILED {
  __typename: "Project_aggregate";
  aggregate: ProjectsOverviewStatusCounts_INCOMPLETE_FAILED_aggregate | null;
}

export interface ProjectsOverviewStatusCounts {
  /**
   * fetch aggregated fields from the table: "Project"
   */
  TEMPLATE: ProjectsOverviewStatusCounts_TEMPLATE;
  /**
   * fetch aggregated fields from the table: "Project"
   */
  PROPOSED: ProjectsOverviewStatusCounts_PROPOSED;
  /**
   * fetch aggregated fields from the table: "Project"
   */
  ONGOING: ProjectsOverviewStatusCounts_ONGOING;
  /**
   * fetch aggregated fields from the table: "Project"
   */
  SENT_BACK: ProjectsOverviewStatusCounts_SENT_BACK;
  /**
   * fetch aggregated fields from the table: "Project"
   */
  SUBMITTED: ProjectsOverviewStatusCounts_SUBMITTED;
  /**
   * fetch aggregated fields from the table: "Project"
   */
  COMPLETED_PASSED: ProjectsOverviewStatusCounts_COMPLETED_PASSED;
  /**
   * fetch aggregated fields from the table: "Project"
   */
  SUGGESTED_FOR_PUBLICATION: ProjectsOverviewStatusCounts_SUGGESTED_FOR_PUBLICATION;
  /**
   * fetch aggregated fields from the table: "Project"
   */
  PUBLISHED: ProjectsOverviewStatusCounts_PUBLISHED;
  /**
   * fetch aggregated fields from the table: "Project"
   */
  INCOMPLETE_FAILED: ProjectsOverviewStatusCounts_INCOMPLETE_FAILED;
}

export interface ProjectsOverviewStatusCountsVariables {
  TEMPLATE: Project_bool_exp;
  PROPOSED: Project_bool_exp;
  ONGOING: Project_bool_exp;
  SENT_BACK: Project_bool_exp;
  SUBMITTED: Project_bool_exp;
  COMPLETED_PASSED: Project_bool_exp;
  SUGGESTED_FOR_PUBLICATION: Project_bool_exp;
  PUBLISHED: Project_bool_exp;
  INCOMPLETE_FAILED: Project_bool_exp;
}
