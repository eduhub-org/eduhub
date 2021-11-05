import { gql } from "@apollo/client";

export const INSERT_USER = gql`
  mutation InsertUser($userId: uuid!) {
    insert_User(
      objects: {
        id: $userId
        lastName: "TestNachName"
        firstName: "TestVorName"
        email: "test@test.de"
      }
    ) {
      affected_rows
      returning {
        id
        picture
        email
        firstName
        lastName
      }
    }
  }
`;
