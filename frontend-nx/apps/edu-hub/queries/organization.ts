import { gql } from '@apollo/client';

export const ORGANIZATION_LIST = gql`
  query OrganizationList(
    $limit: Int = 15
    $offset: Int = 0
    $filter: Organization_bool_exp = {}
    $order_by: [Organization_order_by!] = {updated_at: desc}
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
      logo
      newsletterDescription
      newsletterProvider
      ghostNewsletterApiUrl
      ghostNewsletterListId
      ghostNewsletterSlug
      ghostNewsletterLabel
      ghostNewsletterDoubleOptInEnabled
      created_at
      updated_at
      # Only populated for admins who may manage this organization's settings; null otherwise
      # (the OrganizationSettings permission requires canManageSettings).
      Settings {
        id
        apiKeyHash
        ghostNewsletterApiKeyConfigured
      }
      Users {
        id
      }
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

export const ORGANIZATION_OPTIONS = gql`
  query OrganizationOptions($limit: Int = 10000, $order_by: [Organization_order_by!] = { name: asc }) {
    Organization(limit: $limit, order_by: $order_by) {
      id
      name
      aliases
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

export const CREATE_ORGANIZATION = gql`
  mutation CreateOrganization($value: String!) {
    insert_Organization_one(object: {name: $value, type: OTHER}) {
      id
      type
    }
  }
`;

export const UPDATE_ORGANIZATION_API_KEY_HASH = gql`
  mutation UpdateOrganizationApiKeyHash($id: Int!, $apiKeyHash: String) {
    update_Organization_by_pk(
      pk_columns: { id: $id }
      _set: { apiKeyHash: $apiKeyHash }
    ) {
      id
    }
  }
`;

export const UPDATE_ORGANIZATION_NEWSLETTER_PROVIDER = gql`
  mutation UpdateOrganizationNewsletterProvider($id: Int!, $value: String!) {
    update_Organization_by_pk(
      pk_columns: { id: $id }
      _set: { newsletterProvider: $value }
    ) {
      id
      newsletterProvider
    }
  }
`;

export const UPDATE_ORGANIZATION_GHOST_NEWSLETTER_API_URL = gql`
  mutation UpdateOrganizationGhostNewsletterApiUrl($itemId: Int!, $text: String) {
    update_Organization_by_pk(
      pk_columns: { id: $itemId }
      _set: { ghostNewsletterApiUrl: $text }
    ) {
      id
      ghostNewsletterApiUrl
    }
  }
`;

export const UPDATE_ORGANIZATION_GHOST_NEWSLETTER_LIST_ID = gql`
  mutation UpdateOrganizationGhostNewsletterListId($itemId: Int!, $text: String) {
    update_Organization_by_pk(
      pk_columns: { id: $itemId }
      _set: { ghostNewsletterListId: $text }
    ) {
      id
      ghostNewsletterListId
    }
  }
`;

export const UPDATE_ORGANIZATION_GHOST_NEWSLETTER_SLUG = gql`
  mutation UpdateOrganizationGhostNewsletterSlug($itemId: Int!, $text: String) {
    update_Organization_by_pk(
      pk_columns: { id: $itemId }
      _set: { ghostNewsletterSlug: $text }
    ) {
      id
      ghostNewsletterSlug
    }
  }
`;

export const UPDATE_ORGANIZATION_GHOST_NEWSLETTER_LABEL = gql`
  mutation UpdateOrganizationGhostNewsletterLabel($itemId: Int!, $text: String) {
    update_Organization_by_pk(
      pk_columns: { id: $itemId }
      _set: { ghostNewsletterLabel: $text }
    ) {
      id
      ghostNewsletterLabel
    }
  }
`;

export const UPDATE_ORGANIZATION_GHOST_NEWSLETTER_DOUBLE_OPT_IN_ENABLED = gql`
  mutation UpdateOrganizationGhostNewsletterDoubleOptInEnabled($id: Int!, $value: Boolean!) {
    update_Organization_by_pk(
      pk_columns: { id: $id }
      _set: { ghostNewsletterDoubleOptInEnabled: $value }
    ) {
      id
      ghostNewsletterDoubleOptInEnabled
    }
  }
`;

export const UPDATE_ORGANIZATION_NEWSLETTER_DESCRIPTION = gql`
  mutation UpdateOrganizationNewsletterDescription($itemId: Int!, $text: String) {
    update_Organization_by_pk(
      pk_columns: { id: $itemId }
      _set: { newsletterDescription: $text }
    ) {
      id
      newsletterDescription
    }
  }
`;
