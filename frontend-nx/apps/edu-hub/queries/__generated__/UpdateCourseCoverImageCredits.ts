/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateCourseCoverImageCredits
// ====================================================

export interface UpdateCourseCoverImageCredits_update_Course_by_pk {
  __typename: "Course";
  id: number;
  coverImageCredits: string | null;
}

export interface UpdateCourseCoverImageCredits {
  /**
   * update single row of the table: "Course"
   */
  update_Course_by_pk: UpdateCourseCoverImageCredits_update_Course_by_pk | null;
}

export interface UpdateCourseCoverImageCreditsVariables {
  itemId: number;
  text?: string | null;
}
