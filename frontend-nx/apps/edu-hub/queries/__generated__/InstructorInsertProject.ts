/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { ProjectAuthor_insert_input } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: InstructorInsertProject
// ====================================================

export interface InstructorInsertProject_insert_Project_one {
  __typename: "Project";
  id: number;
}

export interface InstructorInsertProject {
  /**
   * insert a single row into the table: "Project"
   */
  insert_Project_one: InstructorInsertProject_insert_Project_one | null;
}

export interface InstructorInsertProjectVariables {
  title: string;
  type?: string | null;
  documentationInstructionId?: number | null;
  proposedByUserId: any;
  courseId: number;
  authors: ProjectAuthor_insert_input[];
}
