import { gql } from '@apollo/client';

export const ORGANIZATION_FRAGMENT = gql`
  fragment OrganizationFragment on Organization {
    id
    name
    type
    description
    aliases
    logo
    apiKeyHash
    created_at
  }
`;

export const ORGANIZATION_BASIC_FRAGMENT = gql`
  fragment OrganizationBasicFragment on Organization {
    id
    name
    type
  }
`;

export const ORGANIZATION_WITH_USERS_FRAGMENT = gql`
  fragment OrganizationWithUsersFragment on Organization {
    id
    name
    type
    description
    aliases
    logo
    apiKeyHash
    created_at
    Users {
      id
    }
  }
`;
