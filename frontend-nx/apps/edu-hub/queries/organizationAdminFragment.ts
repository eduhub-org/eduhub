import { gql } from '@apollo/client';

export const ORGANIZATION_ADMIN_FRAGMENT = gql`
  fragment OrganizationAdminFragment on OrganizationAdmin {
    id
    User {
      id
      firstName
      lastName
      email
    }
    Organization {
      id
      name
    }
    canManageEvents
    canManageCourses
    canManageSettings
  }
`;

export const ORGANIZATION_ADMIN_BASIC_FRAGMENT = gql`
  fragment OrganizationAdminBasicFragment on OrganizationAdmin {
    id
    canManageEvents
    canManageCourses
    canManageSettings
  }
`;
