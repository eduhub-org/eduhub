/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProjectDocumentationInstruction
// ====================================================

export interface UpdateProjectDocumentationInstruction_update_Project_by_pk {
  __typename: "Project";
  id: number;
  documentationInstructionId: number | null;
}

export interface UpdateProjectDocumentationInstruction {
  /**
   * update single row of the table: "Project"
   */
  update_Project_by_pk: UpdateProjectDocumentationInstruction_update_Project_by_pk | null;
}

export interface UpdateProjectDocumentationInstructionVariables {
  itemId: number;
  value?: number | null;
}
