import { gql } from "@apollo/client";

export const USER = gql`
  query User($authId: uuid!) {
    User_by_pk(id: $authId) {
      id
      picture
      email
      firstName
      lastName
    }
  }
`;
