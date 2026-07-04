/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateBadgeOrder
// ====================================================

export interface UpdateBadgeOrder_update_Badge_by_pk {
  __typename: "Badge";
  id: number;
  order: number;
}

export interface UpdateBadgeOrder {
  update_Badge_by_pk: UpdateBadgeOrder_update_Badge_by_pk | null;
}

export interface UpdateBadgeOrderVariables {
  id: number;
  order: number;
}
