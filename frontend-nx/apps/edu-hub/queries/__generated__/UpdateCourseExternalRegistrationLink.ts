/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateCourseExternalRegistrationLink
// ====================================================

export interface UpdateCourseExternalRegistrationLink_update_Course_by_pk {
  __typename: "Course";
  id: number;
}

export interface UpdateCourseExternalRegistrationLink {
  /**
   * update single row of the table: "Course"
   */
  update_Course_by_pk: UpdateCourseExternalRegistrationLink_update_Course_by_pk | null;
}

export interface UpdateCourseExternalRegistrationLinkVariables {
  itemId: number;
  text: string;
}
