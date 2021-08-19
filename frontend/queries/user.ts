import { gql } from "@apollo/client";

export const USER = gql`
  query User($authId: uuid!) {
    User(where: { AuthId: { _eq: $authId } }) {
      Id
    }
  }
`;
