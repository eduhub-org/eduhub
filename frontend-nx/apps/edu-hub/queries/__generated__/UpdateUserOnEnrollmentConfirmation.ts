/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { University_enum, Employment_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateUserOnEnrollmentConfirmation
// ====================================================

export interface UpdateUserOnEnrollmentConfirmation_update_User_by_pk {
  __typename: "User";
  id: any;
  /**
   * The user's matriculation number at her/his university
   */
  matriculationNumber: string | null;
  /**
   * The user's current employment status
   */
  employment: Employment_enum | null;
  /**
   * The university the user is attending or workin at (only provided if he is a student or working in academia)
   */
  university: University_enum | null;
}

export interface UpdateUserOnEnrollmentConfirmation {
  /**
   * update single row of the table: "User"
   */
  update_User_by_pk: UpdateUserOnEnrollmentConfirmation_update_User_by_pk | null;
}

export interface UpdateUserOnEnrollmentConfirmationVariables {
  userId: any;
  matriculationNumber?: string | null;
  university?: University_enum | null;
  employment?: Employment_enum | null;
}
