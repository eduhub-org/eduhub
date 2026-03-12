/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateCourseLearningGoals
// ====================================================

export interface UpdateCourseLearningGoals_update_Course_by_pk {
  __typename: "Course";
  id: number;
}

export interface UpdateCourseLearningGoals {
  /**
   * update single row of the table: "Course"
   */
  update_Course_by_pk: UpdateCourseLearningGoals_update_Course_by_pk | null;
}

export interface UpdateCourseLearningGoalsVariables {
  itemId: number;
  text: string;
}
