/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProgramParticipationTemplate
// ====================================================

export interface UpdateProgramParticipationTemplate_update_Program_by_pk {
  __typename: "Program";
  id: number;
}

export interface UpdateProgramParticipationTemplate {
  /**
   * update single row of the table: "Program"
   */
  update_Program_by_pk: UpdateProgramParticipationTemplate_update_Program_by_pk | null;
}

export interface UpdateProgramParticipationTemplateVariables {
  programId: number;
  templatePath: string;
}
