/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProgramDefaultProjectType
// ====================================================

export interface UpdateProgramDefaultProjectType_update_Program_by_pk {
  __typename: "Program";
  id: number;
  /**
   * Default Project.type value applied to projects that originate in courses of this program. Students never pick the type; it is finalized by the instructor at the PROPOSED to ONGOING transition.
   */
  defaultProjectType: string | null;
}

export interface UpdateProgramDefaultProjectType {
  /**
   * update single row of the table: "Program"
   */
  update_Program_by_pk: UpdateProgramDefaultProjectType_update_Program_by_pk | null;
}

export interface UpdateProgramDefaultProjectTypeVariables {
  itemId: number;
  value?: string | null;
}
