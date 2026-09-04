import { gql } from '@apollo/client';

// One row per admin *person*, so the settings screen can show a single table of all admins:
// organization admins and super-admins alike.
//
// The caller passes the ids of everyone who is an admin (grant holders from ADMIN_GRANTS, super-
// admins from the getAdminUsers action) and this looks them up, so the filter is a primary-key
// lookup over a handful of ids. It deliberately does NOT ask the database "which users are admins":
// that predicate cannot use the User primary key and degrades into a full scan of a table that
// grows with every signup, on every page change and every keystroke of the search.
//
// Each row carries the user's grants, one per organization they administer; the list is empty for a
// super-admin without any organization role. Role-scoped like the rest of the screen: org admins
// see only users they administer (User select permission), and only the grants of their own
// organizations (OrganizationAdmin select permission).
export const ADMIN_USER_LIST = gql`
  query AdminUserList(
    $limit: Int = 15
    $offset: Int = 0
    $filter: User_bool_exp = {}
    $order_by: [User_order_by!] = [{lastName: asc}, {firstName: asc}]
  ) {
    User(
      limit: $limit
      offset: $offset
      where: $filter
      order_by: $order_by
    ) {
      id
      firstName
      lastName
      email
      Organization {
        id
        name
      }
      OrganizationAdmins(order_by: {Organization: {name: asc}}) {
        id
        organizationId
        Organization {
          id
          name
        }
        canManageEvents
        canManageCourses
        canManageDegrees
        canManageJobs
        canManageSettings
        # How the grant came about. Null means a person granted it; a value means
        # it was claimed self-service on the job board and says what was checked.
        # Server-controlled, so it is safe to read as a review signal.
        claimVerification
        authorizationDeclaredAt
      }
    }
    User_aggregate(where: $filter) {
      aggregate {
        count
      }
    }
  }
`;

// Every admin grant the caller may see (their own organizations; all of them for a super-admin).
// OrganizationAdmin holds one row per (admin, organization) and is orders of magnitude smaller than
// User, so it is fetched unpaginated and serves two purposes on the settings screen:
//   - the set of users to show in the admin table (unioned with the super-admins from Keycloak),
//   - the per-organization count of settings admins, which decides whether a grant is the *sole*
//     settings admin of its organization — the UI then pre-disables turning that flag off or
//     deleting the grant, matching the DB guard that keeps at least one settings admin per org.
export const ADMIN_GRANTS = gql`
  query AdminGrants {
    OrganizationAdmin {
      id
      userId
      organizationId
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
      canManageJobs
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
      canManageJobs
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
