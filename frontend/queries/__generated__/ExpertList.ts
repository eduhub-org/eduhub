/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { Expert_bool_exp } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: ExpertList
// ====================================================

export interface ExpertList_Expert_User {
  __typename: "User";
  /**
   * The user's first name
   */
  firstName: string;
  /**
   * The user's last name
   */
  lastName: string;
  /**
   * The user's email address
   */
  email: string;
}

export interface ExpertList_Expert {
  __typename: "Expert";
  id: number;
  /**
   * The ID of the user that is instructor
   */
  userId: any;
  /**
   * An object relationship
   */
  User: ExpertList_Expert_User;
}

export interface ExpertList {
  /**
   * fetch data from the table: "Expert"
   */
  Expert: ExpertList_Expert[];
}

export interface ExpertListVariables {
  where: Expert_bool_exp;
  limit?: number | null;
  offset?: number | null;
}
