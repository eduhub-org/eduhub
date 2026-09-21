/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CourseEnrollmentStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: CancelOwnEnrollment
// ====================================================

export interface CancelOwnEnrollment_update_CourseEnrollment_returning {
  __typename: "CourseEnrollment";
  id: number;
  /**
   * The users current enrollment status to this course
   */
  status: CourseEnrollmentStatus_enum;
}

export interface CancelOwnEnrollment_update_CourseEnrollment {
  __typename: "CourseEnrollment_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
  /**
   * data from the rows affected by the mutation
   */
  returning: CancelOwnEnrollment_update_CourseEnrollment_returning[];
}

export interface CancelOwnEnrollment {
  /**
   * update data of the table: "CourseEnrollment"
   */
  update_CourseEnrollment: CancelOwnEnrollment_update_CourseEnrollment | null;
}

export interface CancelOwnEnrollmentVariables {
  enrollmentId: number;
  status: CourseEnrollmentStatus_enum;
}
