/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: ProjectTypes
// ====================================================

export interface ProjectTypes_ProjectType {
  __typename: "ProjectType";
  value: string;
  comment: string | null;
  requiresDocumentation: boolean;
  requiresPresentation: boolean;
  requiresExternalUrl: boolean;
  requiresCoverImage: boolean;
  requiresEvaluationScript: boolean;
}

export interface ProjectTypes {
  /**
   * fetch data from the table: "ProjectType"
   */
  ProjectType: ProjectTypes_ProjectType[];
}
