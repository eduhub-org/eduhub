import { gql } from "@apollo/client";

export const USER = gql`
  query User($userId: uuid!) {
    User_by_pk(id: $userId) {
      id
      picture
      email
      firstName
      lastName
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
