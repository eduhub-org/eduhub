/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteJobSliderJobType
// ====================================================

export interface DeleteJobSliderJobType_delete_JobSliderJobType_by_pk {
  __typename: "JobSliderJobType";
  id: number;
}

export interface DeleteJobSliderJobType {
  /**
   * delete single row from the table: "JobSliderJobType"
   */
  delete_JobSliderJobType_by_pk: DeleteJobSliderJobType_delete_JobSliderJobType_by_pk | null;
}

export interface DeleteJobSliderJobTypeVariables {
  id: number;
}
