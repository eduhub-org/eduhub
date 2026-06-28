/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { ProjectTileFragment } from "./ProjectTileFragment";

// ====================================================
// GraphQL query operation: SimilarProjectTiles
// ====================================================

export interface SimilarProjectTiles {
  /**
   * fetch data from the table: "Project"
   */
  Project: ProjectTileFragment[];
}

export interface SimilarProjectTilesVariables {
  excludeId: number;
  courseGroupIds: number[];
}
