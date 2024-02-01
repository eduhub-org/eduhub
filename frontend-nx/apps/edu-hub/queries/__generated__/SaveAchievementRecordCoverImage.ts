/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: SaveAchievementRecordCoverImage
// ====================================================

export interface SaveAchievementRecordCoverImage_saveAchievementRecordCoverImage {
  __typename: "saveFileOutput";
  file_path: string;
  google_link: string;
}

export interface SaveAchievementRecordCoverImage {
  saveAchievementRecordCoverImage: SaveAchievementRecordCoverImage_saveAchievementRecordCoverImage | null;
}

export interface SaveAchievementRecordCoverImageVariables {
  base64File: string;
  fileName: string;
  achievementRecordId: number;
}
