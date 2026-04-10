/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProgramShowExtendedApplicationBanner
// ====================================================

export interface UpdateProgramShowExtendedApplicationBanner {
  /**
   * update data of the table: "Program"
   */
  update_Program_by_pk: UpdateProgramShowExtendedApplicationBanner_update_Program_by_pk | null;
}

export interface UpdateProgramShowExtendedApplicationBanner_update_Program_by_pk {
  __typename: "Program";
  id: number;
  showExtendedApplicationBanner: boolean;
}

export interface UpdateProgramShowExtendedApplicationBannerVariables {
  programId: number;
  value: boolean;
}
