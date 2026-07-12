import { gql } from '@apollo/client';

// Paginated admin list of badge definitions with per-badge award usage count.
// Uses plain scalar variables (no bool_exp/order_by inputs) so the checked-in
// generated types stay self-contained.
export const ADMIN_BADGES = gql`
  query AdminBadges($limit: Int = 20, $offset: Int = 0, $search: String = "%%") {
    Badge(
      where: { title: { _ilike: $search } }
      order_by: [{ title: asc }]
      limit: $limit
      offset: $offset
    ) {
      id
      title
      description
      icon
      updated_at
      ProjectBadges_aggregate {
        aggregate {
          count
        }
      }
    }
    Badge_aggregate(where: { title: { _ilike: $search } }) {
      aggregate {
        count
      }
    }
  }
`;

export const INSERT_BADGE = gql`
  mutation InsertBadge($title: String!, $description: String, $icon: String) {
    insert_Badge_one(object: { title: $title, description: $description, icon: $icon }) {
      id
      title
    }
  }
`;

export const UPDATE_BADGE_TITLE = gql`
  mutation UpdateBadgeTitle($itemId: Int!, $text: String!) {
    update_Badge_by_pk(pk_columns: { id: $itemId }, _set: { title: $text }) {
      id
      title
    }
  }
`;

export const UPDATE_BADGE_DESCRIPTION = gql`
  mutation UpdateBadgeDescription($itemId: Int!, $text: String!) {
    update_Badge_by_pk(pk_columns: { id: $itemId }, _set: { description: $text }) {
      id
      description
    }
  }
`;

export const UPDATE_BADGE_ICON = gql`
  mutation UpdateBadgeIcon($itemId: Int!, $text: String!) {
    update_Badge_by_pk(pk_columns: { id: $itemId }, _set: { icon: $text }) {
      id
      icon
    }
  }
`;

export const DELETE_BADGE = gql`
  mutation DeleteBadge($id: Int!) {
    delete_Badge_by_pk(id: $id) {
      id
    }
  }
`;
