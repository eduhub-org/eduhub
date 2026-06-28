/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { ProjectTileFragment } from "./ProjectTileFragment";

// ====================================================
// GraphQL query operation: CoursePublishedProjectTiles
// ====================================================

export interface CoursePublishedProjectTiles {
  /**
   * fetch data from the table: "Project"
   */
  Project: ProjectTileFragment[];
}

export interface CoursePublishedProjectTilesVariables {
  courseSeriesId: number;
  now: any;
  limit?: number | null;
  offset?: number | null;
}
