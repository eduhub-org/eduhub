import { gql } from "@apollo/client";

export const USER_LIST = gql`
  query UserList {
    User {
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
      otherUniversity
      university
      picture
      externalProfile
      employment
      email
    }
  }
`;

export const INSERT_EXPERT = gql`
  mutation InsertExpert($userId: uuid!) {
    insert_Expert(objects: { userId: $userId }) {
      affected_rows
      returning {
        id
      }
    }
  }
`;

// two versions of this to support the common case of filtering by first and last name together!
export const USER_SELECTION_ONE_PARAM = gql`
  query UserForSelection1($searchValue: String!) {
    User(
      order_by: { lastName: asc }
      where: {
        _or: [
          { firstName: { _ilike: $searchValue } }
          { lastName: { _ilike: $searchValue } }
          { email: { _ilike: $searchValue } }
        ]
      }
    ) {
      id
      firstName
      lastName
      email
      Experts {
        id
      }
    }
  }
`;

export const USER_SELECTION_TWO_PARAMS = gql`
  query UserForSelection2($searchValue1: String!, $searchValue2: String!) {
    User(
      order_by: { lastName: asc }
      where: {
        _or: [
          {
            firstName: { _ilike: $searchValue1 }
            lastName: { _ilike: $searchValue2 }
          }
        ]
      }
    ) {
      id
      firstName
      lastName
      email
      Experts {
        id
      }
    }
  }
`;

export const USERS_BY_LAST_NAME = gql`
  query UsersByLastName(
    $limit: Int = 10
    $offset: Int = 0
    $filter: User_bool_exp = {}
  ) {
    User(
      limit: $limit
      offset: $offset
      order_by: { lastName: asc }
      where: $filter
    ) {
      id
      firstName
      lastName
      email
      matriculationNumber
      university
      employment
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

/**
 * Order by default lastName
 */
export const USERS_WITH_EXPERT_ID = gql`
  query UsersWithExpertId(
    $userOrderBy: User_order_by = { lastName: asc }
    $limit: Int = null
    $offset: Int = 0
    $where: User_bool_exp = {}
  ) {
    User_aggregate(where: $where) {
      aggregate {
        count
      }
    }
    User(
      order_by: [$userOrderBy]
      where: $where
      limit: $limit
      offset: $offset
    ) {
      id
      firstName
      lastName
      email
      Experts {
        id
      }
    }
  }
`;
