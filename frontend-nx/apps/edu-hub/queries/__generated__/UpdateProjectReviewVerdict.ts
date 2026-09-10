/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { ProjectStatus_enum, ProjectRating_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateProjectReviewVerdict
// ====================================================

export interface UpdateProjectReviewVerdict_update_Project_by_pk {
  __typename: "Project";
  id: number;
  status: ProjectStatus_enum;
  rating: ProjectRating_enum | null;
  /**
   * Optional comment from course staff or project mentor accompanying rating (UNRATED/PASSED/FAILED).
   */
  ratingComment: string | null;
  /**
   * Optional per-project submission deadline. When null, the effective deadline is taken from the course (projectSubmissionDeadline) or program defaults.
   */
  submissionDeadline: any | null;
  /**
   * Timestamp at which the project most recently transitioned to SUBMITTED. Cleared when a reviewer sends the project back to ONGOING so the student-side "sent back for revisions" banner remains accurate.
   */
  submittedAt: any | null;
  /**
   * User who issued the most recent SUBMITTED transition. Set via a Hasura permission preset (x-hasura-user-id) so the client cannot impersonate another author.
   */
  submittedBy: any | null;
}

export interface UpdateProjectReviewVerdict {
  /**
   * update single row of the table: "Project"
   */
  update_Project_by_pk: UpdateProjectReviewVerdict_update_Project_by_pk | null;
}

export interface UpdateProjectReviewVerdictVariables {
  itemId: number;
  status: ProjectStatus_enum;
  rating: ProjectRating_enum;
  ratingComment?: string | null;
  submissionDeadline?: any | null;
}
