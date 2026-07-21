/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: AdminJobSliderSources
// ====================================================

export interface AdminJobSliderSources_JobPostingType {
  __typename: "JobPostingType";
  value: string;
}

export interface AdminJobSliderSources {
  /**
   * fetch data from the table: "JobPostingType"
   */
  JobPostingType: AdminJobSliderSources_JobPostingType[];
}
