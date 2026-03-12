/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: SaveAchievementRecordCoverImage
// ====================================================

export interface SaveAchievementRecordCoverImage_saveAchievementRecordCoverImage_resizedPaths {
  __typename: "resizedImagePath";
  size: number;
  filePath: string;
  accessUrl: string;
}

export interface SaveAchievementRecordCoverImage_saveAchievementRecordCoverImage {
  __typename: "saveImageResult";
  success: boolean;
  messageKey: string;
  error: string | null;
  filePath: string;
  accessUrl: string;
  resizedPaths: SaveAchievementRecordCoverImage_saveAchievementRecordCoverImage_resizedPaths[] | null;
}

export interface SaveAchievementRecordCoverImage {
  saveAchievementRecordCoverImage: SaveAchievementRecordCoverImage_saveAchievementRecordCoverImage | null;
}

export interface SaveAchievementRecordCoverImageVariables {
  base64File: string;
  fileName: string;
  achievementRecordId: number;
}
