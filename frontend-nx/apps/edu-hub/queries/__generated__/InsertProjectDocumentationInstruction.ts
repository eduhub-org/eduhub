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
  /**
   * Admin-facing label in instruction dropdowns.
   */
  title: string;
  /**
   * FK to ProjectType.value. Every instruction belongs to exactly one type; must match Project.type when linked (see Project_instruction_matches_type_trg).
   */
  projectTypeValue: string;
  /**
   * When true, this instruction is the default for its projectTypeValue (at most one per type; partial unique index). Shown first in dropdowns and applied when the project type changes.
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
