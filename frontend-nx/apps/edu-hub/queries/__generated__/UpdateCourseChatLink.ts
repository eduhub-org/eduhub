/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateCourseChatLink
// ====================================================

export interface UpdateCourseChatLink_update_Course_by_pk {
  __typename: "Course";
  id: number;
}

export interface UpdateCourseChatLink {
  /**
   * update single row of the table: "Course"
   */
  update_Course_by_pk: UpdateCourseChatLink_update_Course_by_pk | null;
}

export interface UpdateCourseChatLinkVariables {
  courseId: number;
  chatLink: string;
}
