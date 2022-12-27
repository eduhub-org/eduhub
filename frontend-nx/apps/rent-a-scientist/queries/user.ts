import { gql } from '@apollo/client';

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
