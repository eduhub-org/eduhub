/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProjectDocumentationInstructionTitle
// ====================================================

export interface UpdateProjectDocumentationInstructionTitle_update_ProjectDocumentationInstruction_by_pk {
  __typename: "ProjectDocumentationInstruction";
  id: number;
  title: string;
}

export interface UpdateProjectDocumentationInstructionTitle {
  /**
   * update single row of the table: "ProjectDocumentationInstruction"
   */
  update_ProjectDocumentationInstruction_by_pk: UpdateProjectDocumentationInstructionTitle_update_ProjectDocumentationInstruction_by_pk | null;
}

export interface UpdateProjectDocumentationInstructionTitleVariables {
  itemId: number;
  text: string;
}
