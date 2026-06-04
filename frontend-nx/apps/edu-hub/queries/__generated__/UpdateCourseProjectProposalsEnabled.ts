/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateCourseProjectProposalsEnabled
// ====================================================

export interface UpdateCourseProjectProposalsEnabled_update_Course_by_pk {
  __typename: "Course";
  id: number;
  /**
   * Per-course override of Program.projectProposalsEnabledByDefault. When NULL, the program default applies. Only effective when achievementCertificatePossible = true.
   */
  projectProposalsEnabled: boolean | null;
}

export interface UpdateCourseProjectProposalsEnabled {
  /**
   * update single row of the table: "Course"
   */
  update_Course_by_pk: UpdateCourseProjectProposalsEnabled_update_Course_by_pk | null;
}

export interface UpdateCourseProjectProposalsEnabledVariables {
  itemId: number;
  value?: boolean | null;
}
