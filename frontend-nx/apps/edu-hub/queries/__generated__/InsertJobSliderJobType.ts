/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { JobPostingType_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: InsertJobSliderJobType
// ====================================================

export interface InsertJobSliderJobType_insert_JobSliderJobType_one {
  __typename: "JobSliderJobType";
  id: number;
}

export interface InsertJobSliderJobType {
  /**
   * insert a single row into the table: "JobSliderJobType"
   */
  insert_JobSliderJobType_one: InsertJobSliderJobType_insert_JobSliderJobType_one | null;
}

export interface InsertJobSliderJobTypeVariables {
  jobSliderOptionId: number;
  jobType: JobPostingType_enum;
}
