/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: InsertBadge
// ====================================================

export interface InsertBadge_insert_Badge_one {
  __typename: "Badge";
  id: number;
  title: string;
}

export interface InsertBadge {
  insert_Badge_one: InsertBadge_insert_Badge_one | null;
}

export interface InsertBadgeVariables {
  title: string;
  description?: string | null;
  icon?: string | null;
}
