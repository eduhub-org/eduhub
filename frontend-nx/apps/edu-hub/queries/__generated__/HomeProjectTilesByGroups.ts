/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { ProjectTileFragment } from "./ProjectTileFragment";

// ====================================================
// GraphQL query operation: HomeProjectTilesByGroups
// ====================================================

export interface HomeProjectTilesByGroups {
  /**
   * fetch data from the table: "Project"
   */
  Project: ProjectTileFragment[];
}

export interface HomeProjectTilesByGroupsVariables {
  courseGroupIds: number[];
  projectGroupIds: number[];
}
