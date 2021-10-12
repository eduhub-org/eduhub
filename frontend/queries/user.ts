import { gql } from "@apollo/client";

export const USER = gql`
  query User($authId: uuid!) {
    User(where: { authId: { _eq: $authId } }) {
      id
      picture
    }
  }
`;
