/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: RemoveAchievementCertificates
// ====================================================

export interface RemoveAchievementCertificates_update_CourseEnrollment_returning {
  __typename: "CourseEnrollment";
  id: number;
  /**
   * URL to the file containing the user's achievement certificate (if he obtained one)
   */
  achievementCertificateURL: string | null;
}

export interface RemoveAchievementCertificates_update_CourseEnrollment {
  __typename: "CourseEnrollment_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
  /**
   * data from the rows affected by the mutation
   */
  returning: RemoveAchievementCertificates_update_CourseEnrollment_returning[];
}

export interface RemoveAchievementCertificates {
  /**
   * update data of the table: "CourseEnrollment"
   */
  update_CourseEnrollment: RemoveAchievementCertificates_update_CourseEnrollment | null;
}

export interface RemoveAchievementCertificatesVariables {
  enrollmentIds: number[];
}
