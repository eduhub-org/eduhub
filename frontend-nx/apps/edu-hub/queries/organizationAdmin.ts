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
        Organization {
          id
          name
        }
      }
      Organization {
        id
        name
      }
      canManageEvents
      canManageCourses
      canManageDegrees
      canManageSettings
    }
    OrganizationAdmin_aggregate(where: $filter) {
      aggregate {
        count
      }
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

export const UPDATE_ORGANIZATION_ADMIN_CAN_MANAGE_DEGREES = gql`
  mutation UpdateOrganizationAdminCanManageDegrees($id: Int!, $canManageDegrees: Boolean!) {
    update_OrganizationAdmin_by_pk(
      pk_columns: { id: $id },
      _set: { canManageDegrees: $canManageDegrees }
    ) {
      id
      canManageDegrees
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

// Organizations the current user may add admins to. Run under the management role: for a super-admin
// (admin role) this is unused (they use ORGANIZATION_OPTIONS for the full list); for an org admin
// (org_admin role) the row permission scopes OrganizationAdmin to grants they can see, and the
// canManageSettings filter narrows it to organizations they actually administer with settings rights.
// Several rows per organization are expected — dedupe by Organization.id on the client.
export const MANAGEABLE_ORGANIZATIONS = gql`
  query ManageableOrganizations {
    OrganizationAdmin(where: { canManageSettings: { _eq: true } }) {
      organizationId
      Organization {
        id
        name
      }
    }
  }
`;

// Resolve a user by their exact email so a new admin grant can be created from the email entered in
// the add-admin dialog. Only id/firstName/lastName are selected: under the inherited org_admin role
// these come from the public (anonymous) user permission for any user, while the email filter still
// matches the row, so an org admin can add any registered user to an organization they manage.
export const ORGANIZATION_ADMIN_USER_BY_EMAIL = gql`
  query OrganizationAdminUserByEmail($email: String!) {
    User(where: { email: { _eq: $email } }, limit: 1) {
      id
      firstName
      lastName
    }
  }
`;

// Create an admin grant for an existing user. Hasura enforces scope: an org admin may only insert for
// organizations they hold canManageSettings on (super-admins may insert anywhere).
export const INSERT_ORGANIZATION_ADMIN = gql`
  mutation InsertOrganizationAdmin($input: OrganizationAdmin_insert_input!) {
    insert_OrganizationAdmin_one(object: $input) {
      id
      organizationId
      userId
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
      canManageDegrees
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
