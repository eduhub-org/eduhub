/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: ProgramTypeDefaults
// ====================================================

export interface ProgramTypeDefaults_ProgramType {
  __typename: "ProgramType";
  value: string;
  /**
   * App-level default attendance-certificate template for programs of this type. Copied into every newly inserted Program by the set_program_default_attendance_certificate_template_trg trigger when the program's own attendanceCertificateTemplateId is NULL.
   */
  defaultAttendanceCertificateTemplateId: number | null;
}

export interface ProgramTypeDefaults {
  /**
   * fetch data from the table: "ProgramType"
   */
  ProgramType: ProgramTypeDefaults_ProgramType[];
}
