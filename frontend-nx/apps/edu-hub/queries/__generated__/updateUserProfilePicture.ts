/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: updateUserProfilePicture
// ====================================================

export interface updateUserProfilePicture_update_User_by_pk {
  __typename: "User";
  /**
   * The user's profile picture
   */
  picture: string | null;
}

export interface updateUserProfilePicture {
  /**
   * update single row of the table: "User"
   */
  update_User_by_pk: updateUserProfilePicture_update_User_by_pk | null;
}

export interface updateUserProfilePictureVariables {
  userId: any;
  picture?: string | null;
}
