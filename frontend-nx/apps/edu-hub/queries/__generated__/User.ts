/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { UserOccupation_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: User
// ====================================================

export interface User_User_by_pk_Organization {
  __typename: "Organization";
  id: number;
  name: string;
  aliases: any | null;
}

export interface User_User_by_pk {
  __typename: "User";
  id: any;
  /**
   * The user's first name
   */
  firstName: string;
  /**
   * The user's last name
   */
  lastName: string;
  /**
   * The user's matriculation number at her/his university
   */
  matriculationNumber: string | null;
  /**
   * A link to an external profile, for example in LinkedIn or Xing
   */
  externalProfile: string | null;
  /**
   * Provides the users occupation status.
   */
  occupation: UserOccupation_enum | null;
  /**
   * Referring to where the user is occupied. Could be the user's company, higher education institution, or any organization.
   */
  organizationId: number | null;
  /**
   * The user's profile picture
   */
  picture: string | null;
  /**
   * The user's postal/zip code
   */
  zipCode: string | null;
  /**
   * The user's country of residence
   */
  country: string | null;
  /**
   * An object relationship
   */
  Organization: User_User_by_pk_Organization | null;
}

export interface User {
  /**
   * fetch data from the table: "User" using primary key columns
   */
  User_by_pk: User_User_by_pk | null;
}

export interface UserVariables {
  userId: any;
}
