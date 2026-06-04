/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: ProjectDocumentationInstructions
// ====================================================

export interface ProjectDocumentationInstructions_ProjectDocumentationInstruction {
  __typename: "ProjectDocumentationInstruction";
  id: number;
  /**
   * Admin-facing label in instruction dropdowns.
   */
  title: string;
  /**
   * Instruction PDF location: static app path (e.g. /project-documentation-instructions/…) or GCS object path after admin upload. Nullable until a file is attached.
   */
  url: string | null;
  /**
   * FK to ProjectType.value. Every instruction belongs to exactly one type; must match Project.type when linked (see Project_instruction_matches_type_trg).
   */
  projectTypeValue: string;
  /**
   * When true, this instruction is the default for its projectTypeValue (at most one per type; partial unique index). Shown first in dropdowns and applied when the project type changes.
   */
  isDefault: boolean;
}

export interface ProjectDocumentationInstructions {
  /**
   * fetch data from the table: "ProjectDocumentationInstruction"
   */
  ProjectDocumentationInstruction: ProjectDocumentationInstructions_ProjectDocumentationInstruction[];
}
