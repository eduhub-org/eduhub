/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateUserMatriculationNumber
// ====================================================

export interface UpdateUserMatriculationNumber_update_User_by_pk {
  __typename: "User";
  id: any;
  /**
   * The user's matriculation number at her/his university
   */
  matriculationNumber: string | null;
}

export interface UpdateUserMatriculationNumber {
  /**
   * update single row of the table: "User"
   */
  update_User_by_pk: UpdateUserMatriculationNumber_update_User_by_pk | null;
}

export interface UpdateUserMatriculationNumberVariables {
  itemId: any;
  text: string;
}
