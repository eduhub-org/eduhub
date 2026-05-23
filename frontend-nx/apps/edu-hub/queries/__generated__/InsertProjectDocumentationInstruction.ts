/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: InsertProjectDocumentationInstruction
// ====================================================

export interface InsertProjectDocumentationInstruction_insert_ProjectDocumentationInstruction_one {
  __typename: "ProjectDocumentationInstruction";
  id: number;
  title: string;
  /**
   * The single project type this instruction is suitable for.
   */
  projectTypeValue: string;
  /**
   * Exactly one instruction per projectTypeValue is marked default; admin UI swaps defaults atomically.
   */
  isDefault: boolean;
}

export interface InsertProjectDocumentationInstruction {
  /**
   * insert a single row into the table: "ProjectDocumentationInstruction"
   */
  insert_ProjectDocumentationInstruction_one: InsertProjectDocumentationInstruction_insert_ProjectDocumentationInstruction_one | null;
}

export interface InsertProjectDocumentationInstructionVariables {
  title: string;
  projectTypeValue: string;
}
