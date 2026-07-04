/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateBadgeDescription
// ====================================================

export interface UpdateBadgeDescription_update_Badge_by_pk {
  __typename: "Badge";
  id: number;
  description: string | null;
}

export interface UpdateBadgeDescription {
  update_Badge_by_pk: UpdateBadgeDescription_update_Badge_by_pk | null;
}

export interface UpdateBadgeDescriptionVariables {
  itemId: number;
  text: string;
}
