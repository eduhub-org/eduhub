/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateCourseAchievementCertificatePossible
// ====================================================

export interface UpdateCourseAchievementCertificatePossible_update_Course_by_pk {
  __typename: "Course";
  id: number;
}

export interface UpdateCourseAchievementCertificatePossible {
  /**
   * update single row of the table: "Course"
   */
  update_Course_by_pk: UpdateCourseAchievementCertificatePossible_update_Course_by_pk | null;
}

export interface UpdateCourseAchievementCertificatePossibleVariables {
  courseId: number;
  isPossible: boolean;
}
