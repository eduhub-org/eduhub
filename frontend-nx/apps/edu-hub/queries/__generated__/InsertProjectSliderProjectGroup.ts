/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: InsertProjectSliderProjectGroup
// ====================================================

export interface InsertProjectSliderProjectGroup_insert_ProjectSliderProjectGroup_one {
  __typename: "ProjectSliderProjectGroup";
  id: number;
}

export interface InsertProjectSliderProjectGroup {
  /**
   * insert a single row into the table: "ProjectSliderProjectGroup"
   */
  insert_ProjectSliderProjectGroup_one: InsertProjectSliderProjectGroup_insert_ProjectSliderProjectGroup_one | null;
}

export interface InsertProjectSliderProjectGroupVariables {
  projectSliderOptionId: number;
  projectGroupOptionId: number;
}
