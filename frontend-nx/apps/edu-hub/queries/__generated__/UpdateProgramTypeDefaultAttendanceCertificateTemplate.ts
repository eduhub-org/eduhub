/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProgramTypeDefaultAttendanceCertificateTemplate
// ====================================================

export interface UpdateProgramTypeDefaultAttendanceCertificateTemplate_update_ProgramType_by_pk {
  __typename: "ProgramType";
  value: string;
  /**
   * App-level default attendance-certificate template for programs of this type. Copied into every newly inserted Program by the set_program_default_attendance_certificate_template_trg trigger when the program's own attendanceCertificateTemplateId is NULL.
   */
  defaultAttendanceCertificateTemplateId: number | null;
}

export interface UpdateProgramTypeDefaultAttendanceCertificateTemplate {
  /**
   * update single row of the table: "ProgramType"
   */
  update_ProgramType_by_pk: UpdateProgramTypeDefaultAttendanceCertificateTemplate_update_ProgramType_by_pk | null;
}

export interface UpdateProgramTypeDefaultAttendanceCertificateTemplateVariables {
  value: string;
  templateId?: number | null;
}
