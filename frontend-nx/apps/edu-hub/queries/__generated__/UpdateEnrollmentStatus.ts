/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CourseEnrollmentStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateEnrollmentStatus
// ====================================================

export interface UpdateEnrollmentStatus_update_CourseEnrollment_by_pk {
  __typename: "CourseEnrollment";
  id: number;
}

export interface UpdateEnrollmentStatus {
  /**
   * update single row of the table: "CourseEnrollment"
   */
  update_CourseEnrollment_by_pk: UpdateEnrollmentStatus_update_CourseEnrollment_by_pk | null;
}

export interface UpdateEnrollmentStatusVariables {
  enrollmentId: number;
  status: CourseEnrollmentStatus_enum;
}
