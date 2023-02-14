/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: AchievementRecordAuthorFragment
// ====================================================

export interface AchievementRecordAuthorFragment_User {
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
}

export interface AchievementRecordAuthorFragment {
  __typename: "AchievementRecordAuthor";
  id: number;
  created_at: any;
  /**
   * An object relationship
   */
  User: AchievementRecordAuthorFragment_User;
}
