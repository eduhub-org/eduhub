/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: AdminBadges
// ====================================================

export interface AdminBadges_Badge_ProjectBadges_aggregate_aggregate {
  __typename: "ProjectBadge_aggregate_fields";
  count: number;
}

export interface AdminBadges_Badge_ProjectBadges_aggregate {
  __typename: "ProjectBadge_aggregate";
  aggregate: AdminBadges_Badge_ProjectBadges_aggregate_aggregate | null;
}

export interface AdminBadges_Badge {
  __typename: "Badge";
  id: number;
  title: string;
  description: string | null;
  icon: string | null;
  updated_at: any;
  ProjectBadges_aggregate: AdminBadges_Badge_ProjectBadges_aggregate;
}

export interface AdminBadges_Badge_aggregate_aggregate {
  __typename: "Badge_aggregate_fields";
  count: number;
}

export interface AdminBadges_Badge_aggregate {
  __typename: "Badge_aggregate";
  aggregate: AdminBadges_Badge_aggregate_aggregate | null;
}

export interface AdminBadges {
  Badge: AdminBadges_Badge[];
  Badge_aggregate: AdminBadges_Badge_aggregate;
}

export interface AdminBadgesVariables {
  limit?: number | null;
  offset?: number | null;
  search?: string | null;
}
