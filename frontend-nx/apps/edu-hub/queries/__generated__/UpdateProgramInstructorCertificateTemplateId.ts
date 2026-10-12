/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProgramInstructorCertificateTemplateId
// ====================================================

export interface UpdateProgramInstructorCertificateTemplateId_update_Program_by_pk {
  __typename: "Program";
  id: number;
  /**
   * HTML template (type INSTRUCTOR_CERTIFICATE) for the certificates confirming that someone instructed a course of this program.
   */
  instructorCertificateTemplateId: number | null;
}

export interface UpdateProgramInstructorCertificateTemplateId {
  /**
   * update single row of the table: "Program"
   */
  update_Program_by_pk: UpdateProgramInstructorCertificateTemplateId_update_Program_by_pk | null;
}

export interface UpdateProgramInstructorCertificateTemplateIdVariables {
  programId: number;
  value?: number | null;
}
