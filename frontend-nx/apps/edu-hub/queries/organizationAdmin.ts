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
      canManageJobs
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
  mutation UpdateOrganizationAdminCanManageEvents($itemId: Int!, $value: Boolean!) {
    update_OrganizationAdmin_by_pk(
      pk_columns: { id: $itemId },
      _set: { canManageEvents: $value }
    ) {
      id
      canManageEvents
    }
  }
`;

export const UPDATE_ORGANIZATION_ADMIN_CAN_MANAGE_COURSES = gql`
  mutation UpdateOrganizationAdminCanManageCourses($itemId: Int!, $value: Boolean!) {
    update_OrganizationAdmin_by_pk(
      pk_columns: { id: $itemId },
      _set: { canManageCourses: $value }
    ) {
      id
      canManageCourses
    }
  }
`;

export const UPDATE_ORGANIZATION_ADMIN_CAN_MANAGE_DEGREES = gql`
  mutation UpdateOrganizationAdminCanManageDegrees($itemId: Int!, $value: Boolean!) {
    update_OrganizationAdmin_by_pk(
      pk_columns: { id: $itemId },
      _set: { canManageDegrees: $value }
    ) {
      id
      canManageDegrees
    }
  }
`;

export const UPDATE_ORGANIZATION_ADMIN_CAN_MANAGE_JOBS = gql`
  mutation UpdateOrganizationAdminCanManageJobs($itemId: Int!, $value: Boolean!) {
    update_OrganizationAdmin_by_pk(
      pk_columns: { id: $itemId },
      _set: { canManageJobs: $value }
    ) {
      id
      canManageJobs
    }
  }
`;

export const UPDATE_ORGANIZATION_ADMIN_CAN_MANAGE_SETTINGS = gql`
  mutation UpdateOrganizationAdminCanManageSettings($itemId: Int!, $value: Boolean!) {
    update_OrganizationAdmin_by_pk(
      pk_columns: { id: $itemId },
      _set: { canManageSettings: $value }
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

// Capability flags on the current user's OrganizationAdmin grants. Run under org_admin so Hasura
// returns the caller's own rows. Used for menu visibility: show Courses/Events/Degrees when any
// grant carries the matching canManage* flag.
export const MY_ORG_ADMIN_CAPABILITIES = gql`
  query MyOrgAdminCapabilities($userId: uuid!) {
    OrganizationAdmin(where: { userId: { _eq: $userId } }) {
      canManageCourses
      canManageEvents
      canManageDegrees
    }
  }
`;

// Organizations the current user may add admins to. Run under the management role: for a super-admin
// (admin role) this is unused (they use ORGANIZATION_OPTIONS for the full list); for an org admin
// (org_admin role) we scope explicitly to the caller's OWN grant rows that carry canManageSettings.
// The org_admin select permission also exposes colleagues' grants in those organizations, so without
// the userId filter a colleague's settings-enabled grant could surface an organization the caller
// cannot actually add to (the insert check would then reject it). Filtering on the caller's userId
// keeps this aligned with what Hasura allows on insert. One row per administered organization.
export const MANAGEABLE_ORGANIZATIONS = gql`
  query ManageableOrganizations($currentUserId: uuid!) {
    OrganizationAdmin(where: { userId: { _eq: $currentUserId }, canManageSettings: { _eq: true } }) {
      organizationId
      Organization {
        id
        name
      }
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
