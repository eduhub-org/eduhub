/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteProjectDocumentationInstruction
// ====================================================

export interface DeleteProjectDocumentationInstruction_delete_ProjectDocumentationInstruction_by_pk {
  __typename: "ProjectDocumentationInstruction";
  id: number;
}

export interface DeleteProjectDocumentationInstruction {
  /**
   * delete single row from the table: "ProjectDocumentationInstruction"
   */
  delete_ProjectDocumentationInstruction_by_pk: DeleteProjectDocumentationInstruction_delete_ProjectDocumentationInstruction_by_pk | null;
}

export interface DeleteProjectDocumentationInstructionVariables {
  id: number;
}
