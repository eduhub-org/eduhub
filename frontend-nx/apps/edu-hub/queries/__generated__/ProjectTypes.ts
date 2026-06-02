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
  /**
   * Short human-readable summary of this type for admins and instructors (also surfaced in UI type descriptions).
   */
  comment: string | null;
  /**
   * When true, project.documentationUrl must be present before the project can be submitted.
   */
  requiresDocumentation: boolean;
  /**
   * When true, project.presentationUrl must be present before the project can be submitted.
   */
  requiresPresentation: boolean;
  /**
   * When true, project.externalUrl must be present before the project can be submitted (e.g. repository or live demo).
   */
  requiresExternalUrl: boolean;
  /**
   * When true, project.coverImageUrl must be present before submission and for showcase publication.
   */
  requiresCoverImage: boolean;
}

export interface ProjectTypes {
  /**
   * fetch data from the table: "ProjectType"
   */
  ProjectType: ProjectTypes_ProjectType[];
}
