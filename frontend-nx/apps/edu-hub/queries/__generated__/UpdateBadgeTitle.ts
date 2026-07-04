/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateBadgeTitle
// ====================================================

export interface UpdateBadgeTitle_update_Badge_by_pk {
  __typename: "Badge";
  id: number;
  title: string;
}

export interface UpdateBadgeTitle {
  update_Badge_by_pk: UpdateBadgeTitle_update_Badge_by_pk | null;
}

export interface UpdateBadgeTitleVariables {
  itemId: number;
  text: string;
}
