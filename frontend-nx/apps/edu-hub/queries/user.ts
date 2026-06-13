import { gql } from "@apollo/client";
import { User_bool_exp, UserStatus_enum } from "../__generated__/globalTypes";
import { AuthRoles } from "../types/enums";
import { USER_FRAGMENT } from "./userFragment";

/** User picker where-clause. org_admin cannot filter on status in Hasura, so ACTIVE is omitted there. */
export function buildUserSelectionFilter(
  searchFilter: User_bool_exp = {},
  role: AuthRoles
): User_bool_exp {
  if (role === AuthRoles.org_admin) {
    return searchFilter;
  }

  return { _and: [{ status: { _eq: UserStatus_enum.ACTIVE } }, searchFilter] };
}

export const USER_LIST = gql`
  query UserList {
    User(where: { status: { _eq: ACTIVE } }) {
      id
      firstName
      lastName
      email
    }
  }
`;

export const USER = gql`
  query User($userId: uuid!) {
    User_by_pk(id: $userId) {
      id
      firstName
      lastName
      matriculationNumber
      externalProfile
      occupation
      organizationId
      picture
      zipCode
      country
      Organization {
        id
        name
        aliases
      }
    }
  }
`;

// two versions of this to support the common case of filtering by first and last name together!
export const USER_SELECTION_ONE_PARAM = gql`
  query UserForSelection1($searchValue: String!) {
    User(
      order_by: [{ lastName: asc }, { firstName: asc }, { updated_at: desc }]
      where: {
        _and: [
          {
            status: { _eq: ACTIVE }
          },
          {
            _or: [
              { firstName: { _ilike: $searchValue } }
              { lastName: { _ilike: $searchValue } }
              { email: { _ilike: $searchValue } }
            ]
          }
        ]
      }
    ) {
      id
      firstName
      lastName
      email
      updated_at
    }
  }
`;

export const USER_SELECTION_TWO_PARAMS = gql`
  query UserForSelection2($searchValue1: String!, $searchValue2: String!) {
    User(
      order_by: [{ lastName: asc }, { firstName: asc }, { updated_at: desc }]
      where: {
        _and: [
          {
            status: { _eq: ACTIVE }
          },
          {
            _or: [
              {
                firstName: { _ilike: $searchValue1 }
                lastName: { _ilike: $searchValue2 }
              }
            ]
          }
        ]
      }
    ) {
      id
      firstName
      lastName
      email
      updated_at
    }
  }
`;

export const USERS_BY_LAST_NAME = gql`
  query UsersByLastName(
    $limit: Int = 10
    $offset: Int = 0
    $filter: User_bool_exp = {}
    $order_by: [User_order_by!] = [{updated_at: desc}]
  ) {
    User(
      limit: $limit
      offset: $offset
      order_by: $order_by
      where: { _and: [{ status: { _eq: ACTIVE } }, $filter] }
    ) {
      id
      firstName
      lastName
      email
      matriculationNumber
      occupation
      zipCode
      country
      Organization {
        id
        name
      }
      CourseEnrollments {
        id
        courseId
        userId
        status
        updated_at
        Course {
          id
          title
          Program {
            id
            title
            shortTitle
          }
        }
      }
    }
    User_aggregate(where: $filter) {
      aggregate {
        count
      }
    }
  }
`;

export const DELETE_USER = gql`
  mutation DeleteUser($id: uuid!) {
    anonymizeUser(userId: $id) {
      anonymizedUserId
      messageKey
      error
      steps {
        keycloak_deletion
        user_data_anonymization
        motivation_letter_anonymization
        profile_picture_removal
        certificate_anonymization
      }
    }
  }
`;

export const USER_OCCUPATION = gql`
  query UserOccupation {
    UserOccupation {
      value
    }
  }
`;

export const CREATE_USER = gql`
  mutation CreateUser($firstName: String!, $lastName: String!, $email: String!, $sendEmail: Boolean!) {
    createUser(firstName: $firstName, lastName: $lastName, email: $email, sendEmail: $sendEmail) {
      success
      userId
      keycloakUserId
      emailQueued
      error
      messageKey
    }
  }
`;

export const USER_SELECTION_WITH_FILTER = gql`
  ${USER_FRAGMENT}
  query UserSelectionWithFilter(
    $limit: Int = 100
    $filter: User_bool_exp = {}
    $order_by: [User_order_by!] = [{ lastName: asc }, { firstName: asc }]
  ) {
    User(
      limit: $limit
      where: $filter
      order_by: $order_by
    ) {
      ...UserFragment
      updated_at
    }
  }
`;
