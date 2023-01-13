/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { AchievementOptionMentor_set_input } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateAnAchievementOptionMentor
// ====================================================

export interface UpdateAnAchievementOptionMentor_update_AchievementOptionMentor_by_pk {
  __typename: "AchievementOptionMentor";
  id: number;
}

export interface UpdateAnAchievementOptionMentor {
  /**
   * update single row of the table: "AchievementOptionMentor"
   */
  update_AchievementOptionMentor_by_pk: UpdateAnAchievementOptionMentor_update_AchievementOptionMentor_by_pk | null;
}

export interface UpdateAnAchievementOptionMentorVariables {
  id: number;
  changes?: AchievementOptionMentor_set_input | null;
}
