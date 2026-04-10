/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProgramShowExtendedApplicationPeriodBanner
// ====================================================

export interface UpdateProgramShowExtendedApplicationPeriodBanner_update_Program_by_pk {
  __typename: "Program";
  id: number;
  /**
   * Controls whether course tiles should show an extended application period banner after the program deadline has passed while individual course deadlines are still open.
   */
  showExtendedApplicationPeriodBanner: boolean;
}

export interface UpdateProgramShowExtendedApplicationPeriodBanner {
  /**
   * update single row of the table: "Program"
   */
  update_Program_by_pk: UpdateProgramShowExtendedApplicationPeriodBanner_update_Program_by_pk | null;
}

export interface UpdateProgramShowExtendedApplicationPeriodBannerVariables {
  programId: number;
  value: boolean;
}
