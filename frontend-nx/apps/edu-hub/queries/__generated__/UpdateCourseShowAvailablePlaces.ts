/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateCourseShowAvailablePlaces
// ====================================================

export interface UpdateCourseShowAvailablePlaces_update_Course_by_pk {
  __typename: "Course";
  id: number;
  /**
   * When true the course page states how many of the maxParticipants places are still free. Off by default: the page otherwise shows only how many people are taking part, which says the course is alive without advertising how empty it is.
   */
  showAvailablePlaces: boolean;
}

export interface UpdateCourseShowAvailablePlaces {
  /**
   * update single row of the table: "Course"
   */
  update_Course_by_pk: UpdateCourseShowAvailablePlaces_update_Course_by_pk | null;
}

export interface UpdateCourseShowAvailablePlacesVariables {
  courseId: number;
  showAvailablePlaces: boolean;
}
