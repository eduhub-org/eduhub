/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: BadgeMaxOrder
// ====================================================

export interface BadgeMaxOrder_Badge_aggregate_aggregate_max {
  __typename: "Badge_max_fields";
  order: number | null;
}

export interface BadgeMaxOrder_Badge_aggregate_aggregate {
  __typename: "Badge_aggregate_fields";
  max: BadgeMaxOrder_Badge_aggregate_aggregate_max | null;
}

export interface BadgeMaxOrder_Badge_aggregate {
  __typename: "Badge_aggregate";
  aggregate: BadgeMaxOrder_Badge_aggregate_aggregate | null;
}

export interface BadgeMaxOrder {
  Badge_aggregate: BadgeMaxOrder_Badge_aggregate;
}
