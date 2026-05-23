/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { ProjectDocumentationInstruction_bool_exp, ProjectDocumentationInstruction_order_by } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: ProjectDocumentationInstructionsTable
// ====================================================

export interface ProjectDocumentationInstructionsTable_ProjectDocumentationInstruction {
  __typename: "ProjectDocumentationInstruction";
  id: number;
  title: string;
  url: string | null;
  /**
   * The single project type this instruction is suitable for.
   */
  projectTypeValue: string;
  /**
   * Exactly one instruction per projectTypeValue is marked default; admin UI swaps defaults atomically.
   */
  isDefault: boolean;
  updated_at: any;
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
