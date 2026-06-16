/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProjectDocumentationInstructionProjectType
// ====================================================

export interface UpdateProjectDocumentationInstructionProjectType_update_ProjectDocumentationInstruction_by_pk {
  __typename: "ProjectDocumentationInstruction";
  id: number;
  /**
   * FK to ProjectType.value. Every instruction belongs to exactly one type; must match Project.type when linked (see Project_instruction_matches_type_trg).
   */
  projectTypeValue: string;
}

export interface UpdateProjectDocumentationInstructionProjectType {
  /**
   * update single row of the table: "ProjectDocumentationInstruction"
   */
  update_ProjectDocumentationInstruction_by_pk: UpdateProjectDocumentationInstructionProjectType_update_ProjectDocumentationInstruction_by_pk | null;
}

export interface UpdateProjectDocumentationInstructionProjectTypeVariables {
  itemId: number;
  value: string;
}
