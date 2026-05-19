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
  title: string;
  url: string;
}

export interface ProjectDocumentationInstructions {
  /**
   * fetch data from the table: "ProjectDocumentationInstruction"
   */
  ProjectDocumentationInstruction: ProjectDocumentationInstructions_ProjectDocumentationInstruction[];
}
