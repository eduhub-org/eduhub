/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateCourseRequiredEcts
// ====================================================

export interface UpdateCourseRequiredEcts_update_Course_by_pk {
  __typename: "Course";
  id: number;
  /**
   * Minimum number of ECTS a participant must have collected from this degree's member courses (CourseDegree.degreeCourseId = this course) before a degree certificate can be generated. Only member enrollments carrying an achievementCertificateURL count, matching the DegreeParticipationStats view. Only meaningful for a course whose Program.type = 'DEGREES'. NULL = requirement not checked.
   */
  requiredEcts: any | null;
}

export interface UpdateCourseRequiredEcts {
  /**
   * update single row of the table: "Course"
   */
  update_Course_by_pk: UpdateCourseRequiredEcts_update_Course_by_pk | null;
}

export interface UpdateCourseRequiredEctsVariables {
  itemId: number;
  text?: any | null;
}
