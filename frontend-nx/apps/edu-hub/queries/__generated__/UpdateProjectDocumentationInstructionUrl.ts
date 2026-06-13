/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProjectDocumentationInstructionUrl
// ====================================================

export interface UpdateProjectDocumentationInstructionUrl_update_ProjectDocumentationInstruction_by_pk {
  __typename: "ProjectDocumentationInstruction";
  id: number;
  /**
   * Instruction PDF location: static app path (e.g. /project-documentation-instructions/…) or GCS object path after admin upload. Nullable until a file is attached.
   */
  url: string | null;
}

export interface UpdateProjectDocumentationInstructionUrl {
  /**
   * update single row of the table: "ProjectDocumentationInstruction"
   */
  update_ProjectDocumentationInstruction_by_pk: UpdateProjectDocumentationInstructionUrl_update_ProjectDocumentationInstruction_by_pk | null;
}

export interface UpdateProjectDocumentationInstructionUrlVariables {
  itemId: number;
  url?: string | null;
}
