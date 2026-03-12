/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { AchievementOptionMentor_bool_exp } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: DeleteAnAchievementOptionMentorWithWhere
// ====================================================

export interface DeleteAnAchievementOptionMentorWithWhere_delete_AchievementOptionMentor {
  __typename: "AchievementOptionMentor_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
}

export interface DeleteAnAchievementOptionMentorWithWhere {
  /**
   * delete data from the table: "AchievementOptionMentor"
   */
  delete_AchievementOptionMentor: DeleteAnAchievementOptionMentorWithWhere_delete_AchievementOptionMentor | null;
}

export interface DeleteAnAchievementOptionMentorWithWhereVariables {
  where: AchievementOptionMentor_bool_exp;
}
