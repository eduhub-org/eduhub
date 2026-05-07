/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteProjectMentor
// ====================================================

export interface DeleteProjectMentor_delete_ProjectMentor_by_pk {
  __typename: "ProjectMentor";
  id: number;
}

export interface DeleteProjectMentor {
  /**
   * delete single row from the table: "ProjectMentor"
   */
  delete_ProjectMentor_by_pk: DeleteProjectMentor_delete_ProjectMentor_by_pk | null;
}

export interface DeleteProjectMentorVariables {
  id: number;
}
