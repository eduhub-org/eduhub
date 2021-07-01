/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { EnrollmentStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: InsertEnrollment
// ====================================================

export interface InsertEnrollment_insert_Enrollment_returning {
  __typename: "Enrollment";
  Id: number;
  Status: EnrollmentStatus_enum;
}

export interface InsertEnrollment_insert_Enrollment {
  __typename: "Enrollment_mutation_response";
  /**
   * number of affected rows by the mutation
   */
  affected_rows: number;
  /**
   * data of the affected rows by the mutation
   */
  returning: InsertEnrollment_insert_Enrollment_returning[];
}

export interface InsertEnrollment {
  /**
   * insert data into the table: "Enrollment"
   */
  insert_Enrollment: InsertEnrollment_insert_Enrollment | null;
}

export interface InsertEnrollmentVariables {
  participantId: number;
  courseId: number;
  motivationLetter: string;
}
