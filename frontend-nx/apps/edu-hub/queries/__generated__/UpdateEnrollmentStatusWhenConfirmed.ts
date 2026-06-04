/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CourseEnrollmentStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateEnrollmentStatusWhenConfirmed
// ====================================================

export interface UpdateEnrollmentStatusWhenConfirmed_update_CourseEnrollment_returning {
  __typename: "CourseEnrollment";
  id: number;
}

export interface UpdateEnrollmentStatusWhenConfirmed_update_CourseEnrollment {
  __typename: "CourseEnrollment_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
  /**
   * data from the rows affected by the mutation
   */
  returning: UpdateEnrollmentStatusWhenConfirmed_update_CourseEnrollment_returning[];
}

export interface UpdateEnrollmentStatusWhenConfirmed {
  /**
   * update data of the table: "CourseEnrollment"
   */
  update_CourseEnrollment: UpdateEnrollmentStatusWhenConfirmed_update_CourseEnrollment | null;
}

export interface UpdateEnrollmentStatusWhenConfirmedVariables {
  enrollmentIds: number[];
  status: CourseEnrollmentStatus_enum;
  courseId: number;
}
