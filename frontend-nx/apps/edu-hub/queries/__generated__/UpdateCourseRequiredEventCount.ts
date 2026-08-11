/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateCourseRequiredEventCount
// ====================================================

export interface UpdateCourseRequiredEventCount_update_Course_by_pk {
  __typename: "Course";
  id: number;
  /**
   * Minimum number of this degree's member courses in an EVENTS program the participant must be enrolled in before a degree certificate can be generated. Enrollment alone counts, no certificate required, matching the DegreeParticipationStats view. Only meaningful for a course whose Program.type = 'DEGREES'. NULL = requirement not checked.
   */
  requiredEventCount: number | null;
}

export interface UpdateCourseRequiredEventCount {
  /**
   * update single row of the table: "Course"
   */
  update_Course_by_pk: UpdateCourseRequiredEventCount_update_Course_by_pk | null;
}

export interface UpdateCourseRequiredEventCountVariables {
  itemId: number;
  text?: number | null;
}
