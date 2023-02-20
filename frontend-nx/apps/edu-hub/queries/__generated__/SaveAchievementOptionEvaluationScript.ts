/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: SaveAchievementOptionEvaluationScript
// ====================================================

export interface SaveAchievementOptionEvaluationScript_saveAchievementOptionEvaluationScript {
  __typename: "saveFileOutput";
  google_link: string;
  path: string;
}

export interface SaveAchievementOptionEvaluationScript {
  saveAchievementOptionEvaluationScript: SaveAchievementOptionEvaluationScript_saveAchievementOptionEvaluationScript | null;
}

export interface SaveAchievementOptionEvaluationScriptVariables {
  base64File: string;
  achievementOptionId: number;
}
