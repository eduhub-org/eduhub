/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { ProjectDocumentationInstruction_bool_exp, ProjectDocumentationInstruction_order_by } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: ProjectDocumentationInstructionsTable
// ====================================================

export interface ProjectDocumentationInstructionsTable_ProjectDocumentationInstruction_Projects_aggregate_aggregate {
  __typename: "Project_aggregate_fields";
  count: number;
}

export interface ProjectDocumentationInstructionsTable_ProjectDocumentationInstruction_Projects_aggregate {
  __typename: "Project_aggregate";
  aggregate: ProjectDocumentationInstructionsTable_ProjectDocumentationInstruction_Projects_aggregate_aggregate | null;
}

export interface ProjectDocumentationInstructionsTable_ProjectDocumentationInstruction {
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
  /**
   * An aggregate relationship
   */
  Projects_aggregate: ProjectDocumentationInstructionsTable_ProjectDocumentationInstruction_Projects_aggregate;
}

export interface ProjectDocumentationInstructionsTable_ProjectDocumentationInstruction_aggregate_aggregate {
  __typename: "ProjectDocumentationInstruction_aggregate_fields";
  count: number;
}

export interface ProjectDocumentationInstructionsTable_ProjectDocumentationInstruction_aggregate {
  __typename: "ProjectDocumentationInstruction_aggregate";
  aggregate: ProjectDocumentationInstructionsTable_ProjectDocumentationInstruction_aggregate_aggregate | null;
}

export interface ProjectDocumentationInstructionsTable {
  /**
   * fetch data from the table: "ProjectDocumentationInstruction"
   */
  ProjectDocumentationInstruction: ProjectDocumentationInstructionsTable_ProjectDocumentationInstruction[];
  /**
   * fetch aggregated fields from the table: "ProjectDocumentationInstruction"
   */
  ProjectDocumentationInstruction_aggregate: ProjectDocumentationInstructionsTable_ProjectDocumentationInstruction_aggregate;
}

export interface ProjectDocumentationInstructionsTableVariables {
  limit?: number | null;
  offset?: number | null;
  filter?: ProjectDocumentationInstruction_bool_exp | null;
  order_by?: ProjectDocumentationInstruction_order_by[] | null;
}
