/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { University_enum, Employment_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: updateUser
// ====================================================

export interface updateUser_update_User_by_pk {
  __typename: "User";
  id: any;
  /**
   * The user's first name
   */
  firstName: string;
  /**
   * The user's matriculation number at her/his university
   */
  matriculationNumber: string | null;
  /**
   * The user's last name
   */
  lastName: string;
  /**
   * The user's current employment status
   */
  employment: Employment_enum | null;
  /**
   * The user's email address
   */
  email: string;
  /**
   * A link to an external profile, for example in LinkedIn or Xing
   */
  externalProfile: string | null;
  /**
   * The university the user is attending or workin at (only provided if he is a student or working in academia)
   */
  university: University_enum | null;
  /**
   * The user's profile picture
   */
  picture: string | null;
}

export interface updateUser {
  /**
   * update single row of the table: "User"
   */
  update_User_by_pk: updateUser_update_User_by_pk | null;
}

export interface updateUserVariables {
  userId: any;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  matriculationNumber?: string | null;
  university?: University_enum | null;
  externalProfile?: string | null;
  employment?: Employment_enum | null;
  picture?: string | null;
}
