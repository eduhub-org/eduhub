/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteProjectSliderProjectGroup
// ====================================================

export interface DeleteProjectSliderProjectGroup_delete_ProjectSliderProjectGroup_by_pk {
  __typename: "ProjectSliderProjectGroup";
  id: number;
}

export interface DeleteProjectSliderProjectGroup {
  /**
   * delete single row from the table: "ProjectSliderProjectGroup"
   */
  delete_ProjectSliderProjectGroup_by_pk: DeleteProjectSliderProjectGroup_delete_ProjectSliderProjectGroup_by_pk | null;
}

export interface DeleteProjectSliderProjectGroupVariables {
  id: number;
}
