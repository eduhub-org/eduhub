/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { ProjectDocumentationInstruction_bool_exp } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: MyProjectDocumentationInstructions
// ====================================================

export interface MyProjectDocumentationInstructions_ProjectDocumentationInstruction {
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
  updated_at: any;
}

export interface MyProjectDocumentationInstructions {
  /**
   * fetch data from the table: "ProjectDocumentationInstruction"
   */
  ProjectDocumentationInstruction: MyProjectDocumentationInstructions_ProjectDocumentationInstruction[];
}

export interface MyProjectDocumentationInstructionsVariables {
  filter: ProjectDocumentationInstruction_bool_exp;
  limit: number;
}
