/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: SaveAchievementRecordDocumentation
// ====================================================

export interface SaveAchievementRecordDocumentation_saveAchievementRecordDocumentation {
  __typename: "loadFileOutput";
  link: string;
}

export interface SaveAchievementRecordDocumentation {
  saveAchievementRecordDocumentation: SaveAchievementRecordDocumentation_saveAchievementRecordDocumentation | null;
}

export interface SaveAchievementRecordDocumentationVariables {
  base64File: string;
  fileName: string;
  achievementRecordId: number;
}
