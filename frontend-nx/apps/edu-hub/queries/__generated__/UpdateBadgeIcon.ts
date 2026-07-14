/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateBadgeIcon
// ====================================================

export interface UpdateBadgeIcon_update_Badge_by_pk {
  __typename: "Badge";
  id: number;
  icon: string | null;
}

export interface UpdateBadgeIcon {
  /**
   * update single row of the table: "Badge"
   */
  update_Badge_by_pk: UpdateBadgeIcon_update_Badge_by_pk | null;
}

export interface UpdateBadgeIconVariables {
  itemId: number;
  text: string;
}
