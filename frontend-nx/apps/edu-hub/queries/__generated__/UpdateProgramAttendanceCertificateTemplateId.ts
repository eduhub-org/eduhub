/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProgramAttendanceCertificateTemplateId
// ====================================================

export interface UpdateProgramAttendanceCertificateTemplateId_update_Program_by_pk {
  __typename: "Program";
  id: number;
  /**
   * Default attendance-certificate template for courses in this program. Falls back to NULL when no template is configured.
   */
  attendanceCertificateTemplateId: number | null;
}

export interface UpdateProgramAttendanceCertificateTemplateId {
  /**
   * update single row of the table: "Program"
   */
  update_Program_by_pk: UpdateProgramAttendanceCertificateTemplateId_update_Program_by_pk | null;
}

export interface UpdateProgramAttendanceCertificateTemplateIdVariables {
  programId: number;
  value?: number | null;
}
