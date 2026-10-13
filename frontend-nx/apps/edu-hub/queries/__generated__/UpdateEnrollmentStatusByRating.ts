/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { MotivationRating_enum, CourseEnrollmentStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateEnrollmentStatusByRating
// ====================================================

export interface UpdateEnrollmentStatusByRating_update_CourseEnrollment_returning {
  __typename: "CourseEnrollment";
  id: number;
}

export interface UpdateEnrollmentStatusByRating_update_CourseEnrollment {
  __typename: "CourseEnrollment_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
  /**
   * data from the rows affected by the mutation
   */
  returning: UpdateEnrollmentStatusByRating_update_CourseEnrollment_returning[];
}

export interface UpdateEnrollmentStatusByRating {
  /**
   * update data of the table: "CourseEnrollment"
   */
  update_CourseEnrollment: UpdateEnrollmentStatusByRating_update_CourseEnrollment | null;
}

export interface UpdateEnrollmentStatusByRatingVariables {
  enrollmentIds: number[];
  rating: MotivationRating_enum;
  status: CourseEnrollmentStatus_enum;
  expire?: any | null;
}
