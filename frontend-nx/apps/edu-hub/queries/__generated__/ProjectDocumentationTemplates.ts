/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: ProjectDocumentationTemplates
// ====================================================

export interface ProjectDocumentationTemplates_ProjectDocumentationTemplate {
  __typename: "ProjectDocumentationTemplate";
  id: number;
  title: string;
  url: string;
}

export interface ProjectDocumentationTemplates {
  /**
   * fetch data from the table: "ProjectDocumentationTemplate"
   */
  ProjectDocumentationTemplate: ProjectDocumentationTemplates_ProjectDocumentationTemplate[];
}
