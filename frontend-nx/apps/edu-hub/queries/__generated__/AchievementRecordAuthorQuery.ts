/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { AchievementRecordAuthor_bool_exp, AchievementRecordAuthor_order_by, University_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: AchievementRecordAuthorQuery
// ====================================================

export interface AchievementRecordAuthorQuery_AchievementRecordAuthor_User {
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
   * The user's email address
   */
  email: string;
  /**
   * The user's profile picture
   */
  picture: string | null;
  /**
   * A link to an external profile, for example in LinkedIn or Xing
   */
  externalProfile: string | null;
  /**
   * The university the user is attending or workin at (only provided if he is a student or working in academia)
   */
  university: University_enum | null;
  /**
   * Name of the university the student is attending or working at (only provided if his/her university is not part of the provided list)
   */
  otherUniversity: string | null;
}

export interface AchievementRecordAuthorQuery_AchievementRecordAuthor {
  __typename: "AchievementRecordAuthor";
  id: number;
  created_at: any;
  /**
   * An object relationship
   */
  User: AchievementRecordAuthorQuery_AchievementRecordAuthor_User;
}

export interface AchievementRecordAuthorQuery {
  /**
   * fetch data from the table: "AchievementRecordAuthor"
   */
  AchievementRecordAuthor: AchievementRecordAuthorQuery_AchievementRecordAuthor[];
}

export interface AchievementRecordAuthorQueryVariables {
  where: AchievementRecordAuthor_bool_exp;
  limit?: number | null;
  offset?: number | null;
  orderBy?: AchievementRecordAuthor_order_by | null;
}
