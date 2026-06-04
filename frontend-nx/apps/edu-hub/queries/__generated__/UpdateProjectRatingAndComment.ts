/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { ProjectRating_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateProjectRatingAndComment
// ====================================================

export interface UpdateProjectRatingAndComment_update_Project_by_pk {
  __typename: "Project";
  id: number;
  rating: ProjectRating_enum | null;
  /**
   * Optional comment from course staff or project mentor accompanying rating (UNRATED/PASSED/FAILED).
   */
  ratingComment: string | null;
}

export interface UpdateProjectRatingAndComment {
  /**
   * update single row of the table: "Project"
   */
  update_Project_by_pk: UpdateProjectRatingAndComment_update_Project_by_pk | null;
}

export interface UpdateProjectRatingAndCommentVariables {
  itemId: number;
  rating: ProjectRating_enum;
  ratingComment?: string | null;
}
