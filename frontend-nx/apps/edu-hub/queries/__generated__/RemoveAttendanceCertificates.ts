/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: RemoveAttendanceCertificates
// ====================================================

export interface RemoveAttendanceCertificates_update_CourseEnrollment_returning {
  __typename: "CourseEnrollment";
  id: number;
  /**
   * URL to the file containing the user's attendance certificate (if he obtained one)
   */
  attendanceCertificateURL: string | null;
}

export interface RemoveAttendanceCertificates_update_CourseEnrollment {
  __typename: "CourseEnrollment_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
  /**
   * data from the rows affected by the mutation
   */
  returning: RemoveAttendanceCertificates_update_CourseEnrollment_returning[];
}

export interface RemoveAttendanceCertificates {
  /**
   * update data of the table: "CourseEnrollment"
   */
  update_CourseEnrollment: RemoveAttendanceCertificates_update_CourseEnrollment | null;
}

export interface RemoveAttendanceCertificatesVariables {
  enrollmentIds: number[];
}
