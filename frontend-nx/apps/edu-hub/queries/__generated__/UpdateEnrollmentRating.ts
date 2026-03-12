/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { MotivationRating_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateEnrollmentRating
// ====================================================

export interface UpdateEnrollmentRating_update_CourseEnrollment_by_pk {
  __typename: "CourseEnrollment";
  id: number;
}

export interface UpdateEnrollmentRating {
  /**
   * update single row of the table: "CourseEnrollment"
   */
  update_CourseEnrollment_by_pk: UpdateEnrollmentRating_update_CourseEnrollment_by_pk | null;
}

export interface UpdateEnrollmentRatingVariables {
  enrollmentId: number;
  rating: MotivationRating_enum;
}
