import { gql } from '@apollo/client';

// Admin list of project group options with how many projects are assigned to each
// (used to decide whether a group can be deleted).
export const ADMIN_PROJECT_GROUP_OPTIONS = gql`
  query AdminProjectGroupOptions {
    ProjectGroupOption(order_by: { order: asc }) {
      id
      order
      title
      organizationId
      ProjectGroups_aggregate {
        aggregate {
          count
        }
      }
      ProjectSliderProjectGroups_aggregate {
        aggregate {
          count
        }
      }
    }
  }
`;

export const INSERT_PROJECT_GROUP_OPTION = gql`
  mutation InsertProjectGroupOption($title: String!, $order: Int!) {
    insert_ProjectGroupOption_one(object: { title: $title, order: $order }) {
      id
      title
      order
      __typename
    }
  }
`;

export const UPDATE_PROJECT_GROUP_OPTION_ORDER = gql`
  mutation UpdateProjectGroupOptionOrder($id: Int!, $order: Int!) {
    update_ProjectGroupOption_by_pk(pk_columns: { id: $id }, _set: { order: $order }) {
      id
      order
      __typename
    }
  }
`;

export const DELETE_PROJECT_GROUP_OPTION = gql`
  mutation DeleteProjectGroupOption($id: Int!) {
    delete_ProjectGroupOption_by_pk(id: $id) {
      id
      __typename
    }
  }
`;
