/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CourseEnrollmentStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateEnrollment
// ====================================================

export interface UpdateEnrollment_insert_CourseEnrollment {
  __typename: "CourseEnrollment_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
}

export interface UpdateEnrollment {
  /**
   * insert data into the table: "CourseEnrollment"
   */
  insert_CourseEnrollment: UpdateEnrollment_insert_CourseEnrollment | null;
}

export interface UpdateEnrollmentVariables {
  userId: any;
  courseId: number;
  motivationLetter: string;
  status: CourseEnrollmentStatus_enum;
}
