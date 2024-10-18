import { gql } from '@apollo/client';

export const ORGANIZATION_LIST = gql`
  query OrganizationList(
    $limit: Int = 15
    $offset: Int = 0
    $filter: Organization_bool_exp = {}
    $order_by: [Organization_order_by!] = {name: asc}
  ) {
    Organization(
      limit: $limit
      offset: $offset
      where: $filter
      order_by: $order_by
    ) {
      id
      name
      type
      description
      aliases
    }
    Organization_aggregate(where: $filter) {
      aggregate {
        count
      }
    }
    OrganizationType {
      value
    }
  }
`;

export const INSERT_ORGANIZATION = gql`
  mutation InsertOrganization($insertInput: Organization_insert_input!) {
    insert_Organization_one(object: $insertInput) {
      id
      name
      type
      description
    }
  }
`;

export const UPDATE_ORGANIZATION_NAME = gql`
  mutation UpdateOrganizationName($itemId: Int!, $text: String!) {
    update_Organization_by_pk(pk_columns: { id: $itemId }, _set: { name: $text }) {
      id
      name
    }
  }
`;

export const UPDATE_ORGANIZATION_TYPE = gql`
  mutation UpdateOrganizationType($id: Int!, $value: OrganizationType_enum!) {
    update_Organization_by_pk(pk_columns: {id: $id}, _set: {type: $value}) {
      id
      type
    }
  }
`;

export const UPDATE_ORGANIZATION_DESCRIPTION = gql`
  mutation UpdateOrganizationDescription($itemId: Int!, $text: String!) {
    update_Organization_by_pk(pk_columns: { id: $itemId }, _set: { description: $text }) {
      id
      description
    }
  }
`;

export const UPDATE_ORGANIZATION_ALIASES = gql`
  mutation UpdateOrganizationAliases($id: Int!, $tags: jsonb!) {
    update_Organization_by_pk(
      pk_columns: { id: $id },
      _set: { aliases: $tags }
    ) {
      id
      aliases
    }
  }
`;

export const DELETE_ORGANIZATION = gql`
  mutation DeleteOrganization($id: Int!) {
    delete_Organization_by_pk(id: $id) {
      id
    }
  }
`;
