/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { AchievementRecordType_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateAchievementOptionRecordType
// ====================================================

export interface UpdateAchievementOptionRecordType_update_AchievementOption_by_pk {
  __typename: "AchievementOption";
  id: number;
}

export interface UpdateAchievementOptionRecordType {
  /**
   * update single row of the table: "AchievementOption"
   */
  update_AchievementOption_by_pk: UpdateAchievementOptionRecordType_update_AchievementOption_by_pk | null;
}

export interface UpdateAchievementOptionRecordTypeVariables {
  itemId: number;
  value: AchievementRecordType_enum;
}
