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
  /**
   * FK to ProjectDocumentationInstruction.id. Must match Project.type (trigger Project_instruction_matches_type_trg). Instruction PDF describes deliverable composition; enforced uploads are only those required by the project type.
   */
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
