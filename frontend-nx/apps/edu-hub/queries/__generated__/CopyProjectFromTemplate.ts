/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: CopyProjectFromTemplate
// ====================================================

export interface CopyProjectFromTemplate_copyProjectFromTemplate {
  __typename: "CopyProjectFromTemplateResult";
  success: boolean;
  messageKey: string;
  error: string | null;
  projectId: number | null;
}

export interface CopyProjectFromTemplate {
  /**
   * Claims an open Project template by copying it for the current user. Inserts ProjectAuthor (ACCEPTED), copies ProjectMentor rows from the parent, and links the new project to the requested course.
   */
  copyProjectFromTemplate: CopyProjectFromTemplate_copyProjectFromTemplate;
}

export interface CopyProjectFromTemplateVariables {
  parentProjectId: number;
  courseId: number;
}
