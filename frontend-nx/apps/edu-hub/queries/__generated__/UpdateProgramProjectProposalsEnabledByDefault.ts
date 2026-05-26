/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProgramProjectProposalsEnabledByDefault
// ====================================================

export interface UpdateProgramProjectProposalsEnabledByDefault_update_Program_by_pk {
  __typename: "Program";
  id: number;
  /**
   * Default value for Course.projectProposalsEnabled within this program. Controls whether course participants can propose new projects when the course also has achievementCertificatePossible enabled.
   */
  projectProposalsEnabledByDefault: boolean;
}

export interface UpdateProgramProjectProposalsEnabledByDefault {
  /**
   * update single row of the table: "Program"
   */
  update_Program_by_pk: UpdateProgramProjectProposalsEnabledByDefault_update_Program_by_pk | null;
}

export interface UpdateProgramProjectProposalsEnabledByDefaultVariables {
  programId: number;
  value: boolean;
}
