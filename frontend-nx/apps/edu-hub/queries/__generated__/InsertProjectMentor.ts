/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: InsertProjectMentor
// ====================================================

export interface InsertProjectMentor_insert_ProjectMentor_one {
  __typename: "ProjectMentor";
  id: number;
}

export interface InsertProjectMentor {
  /**
   * insert a single row into the table: "ProjectMentor"
   */
  insert_ProjectMentor_one: InsertProjectMentor_insert_ProjectMentor_one | null;
}

export interface InsertProjectMentorVariables {
  projectId: number;
  userId: any;
}
