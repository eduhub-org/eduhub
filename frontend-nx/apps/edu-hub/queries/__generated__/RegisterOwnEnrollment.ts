/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CourseEnrollmentStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: RegisterOwnEnrollment
// ====================================================

export interface RegisterOwnEnrollment_insert_CourseEnrollment_returning {
  __typename: "CourseEnrollment";
  id: number;
}

export interface RegisterOwnEnrollment_insert_CourseEnrollment {
  __typename: "CourseEnrollment_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
  /**
   * data from the rows affected by the mutation
   */
  returning: RegisterOwnEnrollment_insert_CourseEnrollment_returning[];
}

export interface RegisterOwnEnrollment {
  /**
   * insert data into the table: "CourseEnrollment"
   */
  insert_CourseEnrollment: RegisterOwnEnrollment_insert_CourseEnrollment | null;
}

export interface RegisterOwnEnrollmentVariables {
  userId: any;
  courseId: number;
  motivationLetter: string;
  status: CourseEnrollmentStatus_enum;
  termsAcceptedAt?: any | null;
}
