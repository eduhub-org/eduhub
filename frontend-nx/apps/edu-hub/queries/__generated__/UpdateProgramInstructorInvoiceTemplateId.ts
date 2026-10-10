/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProgramInstructorInvoiceTemplateId
// ====================================================

export interface UpdateProgramInstructorInvoiceTemplateId_update_Program_by_pk {
  __typename: "Program";
  id: number;
  /**
   * HTML template (type INSTRUCTOR_INVOICE) used to render the invoices instructors download for their share of a course fee.
   */
  instructorInvoiceTemplateId: number | null;
}

export interface UpdateProgramInstructorInvoiceTemplateId {
  /**
   * update single row of the table: "Program"
   */
  update_Program_by_pk: UpdateProgramInstructorInvoiceTemplateId_update_Program_by_pk | null;
}

export interface UpdateProgramInstructorInvoiceTemplateIdVariables {
  programId: number;
  value?: number | null;
}
