/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProjectDocumentationTemplate
// ====================================================

export interface UpdateProjectDocumentationTemplate_update_Project_by_pk {
  __typename: "Project";
  id: number;
  documentationTemplateId: number | null;
}

export interface UpdateProjectDocumentationTemplate {
  /**
   * update single row of the table: "Project"
   */
  update_Project_by_pk: UpdateProjectDocumentationTemplate_update_Project_by_pk | null;
}

export interface UpdateProjectDocumentationTemplateVariables {
  itemId: number;
  value?: number | null;
}
