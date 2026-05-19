import { gql } from '@apollo/client';

export const ORGANIZATION_ADMIN_LIST = gql`
  query OrganizationAdminList(
    $limit: Int = 15
    $offset: Int = 0
    $filter: OrganizationAdmin_bool_exp = {}
    $order_by: [OrganizationAdmin_order_by!] = {updated_at: desc}
  ) {
    OrganizationAdmin(
      limit: $limit
      offset: $offset
      where: $filter
      order_by: $order_by
    ) {
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
    OrganizationAdmin_aggregate(where: $filter) {
      aggregate {
        count
      }
    }
  }
`;

export const INSERT_ORGANIZATION_ADMIN = gql`
  mutation InsertOrganizationAdmin(
    $userId: uuid!
    $organizationId: Int!
    $canManageCourses: Boolean = false
    $canManageEvents: Boolean = false
    $canManageSettings: Boolean = false
  ) {
    insert_OrganizationAdmin_one(
      object: {
        userId: $userId
        organizationId: $organizationId
        canManageCourses: $canManageCourses
        canManageEvents: $canManageEvents
        canManageSettings: $canManageSettings
      }
    ) {
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
      canManageCourses
      canManageEvents
      canManageSettings
    }
  }
`;

export const DELETE_ORGANIZATION_ADMIN = gql`
  mutation DeleteOrganizationAdmin($id: Int!) {
    delete_OrganizationAdmin_by_pk(id: $id) {
      id
      User {
        id
        firstName
        lastName
      }
      Organization {
        id
        name
      }
    }
  }
`;

export const UPDATE_ORGANIZATION_ADMIN_CAN_MANAGE_EVENTS = gql`
  mutation UpdateOrganizationAdminCanManageEvents($id: Int!, $canManageEvents: Boolean!) {
    update_OrganizationAdmin_by_pk(
      pk_columns: { id: $id },
      _set: { canManageEvents: $canManageEvents }
    ) {
      id
      canManageEvents
    }
  }
`;

export const UPDATE_ORGANIZATION_ADMIN_CAN_MANAGE_COURSES = gql`
  mutation UpdateOrganizationAdminCanManageCourses($id: Int!, $canManageCourses: Boolean!) {
    update_OrganizationAdmin_by_pk(
      pk_columns: { id: $id },
      _set: { canManageCourses: $canManageCourses }
    ) {
      id
      canManageCourses
    }
  }
`;

export const UPDATE_ORGANIZATION_ADMIN_CAN_MANAGE_SETTINGS = gql`
  mutation UpdateOrganizationAdminCanManageSettings($id: Int!, $canManageSettings: Boolean!) {
    update_OrganizationAdmin_by_pk(
      pk_columns: { id: $id },
      _set: { canManageSettings: $canManageSettings }
    ) {
      id
      canManageSettings
    }
  }
`;

export const UPDATE_ORGANIZATION_ADMIN_ORGANIZATION_ID = gql`
  mutation UpdateOrganizationAdminOrganizationId($id: Int!, $organizationId: Int!) {
    update_OrganizationAdmin_by_pk(
      pk_columns: { id: $id },
      _set: { organizationId: $organizationId }
    ) {
      id
      organizationId
    }
  }
`;

export const ORGANIZATION_ADMINS_BY_ORGANIZATION_ID = gql`
  query OrganizationAdminsByOrganizationId($organizationIds: [Int!]!) {
    OrganizationAdmin(where: { organizationId: { _in: $organizationIds } }) {
      id
      userId
      organizationId
      canManageEvents
      canManageCourses
      canManageSettings
      User {
        id
        firstName
        lastName
        email
      }
    }
  }
`;
