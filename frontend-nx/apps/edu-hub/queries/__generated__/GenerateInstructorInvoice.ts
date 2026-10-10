/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: GenerateInstructorInvoice
// ====================================================

export interface GenerateInstructorInvoice_generateInstructorInvoice {
  __typename: "InstructorDocumentResult";
  success: boolean;
  path: string | null;
  error: string | null;
  messageKey: string;
}

export interface GenerateInstructorInvoice {
  /**
   * Locks the course's instructor payment split and renders the caller's invoice PDF
   */
  generateInstructorInvoice: GenerateInstructorInvoice_generateInstructorInvoice;
}

export interface GenerateInstructorInvoiceVariables {
  courseId: number;
}
