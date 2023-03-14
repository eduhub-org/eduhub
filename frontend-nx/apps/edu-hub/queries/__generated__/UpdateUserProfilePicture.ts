/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateUserProfilePicture
// ====================================================

export interface UpdateUserProfilePicture_update_User_by_pk {
  __typename: "User";
  id: any;
  /**
   * The user's profile picture
   */
  picture: string | null;
}

export interface UpdateUserProfilePicture {
  /**
   * update single row of the table: "User"
   */
  update_User_by_pk: UpdateUserProfilePicture_update_User_by_pk | null;
}

export interface UpdateUserProfilePictureVariables {
  userId: any;
  picture?: string | null;
}
