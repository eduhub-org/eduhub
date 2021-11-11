import { gql } from "@apollo/client";

export const INSERT_USER = gql`
  mutation InsertUser(
    $userId: uuid!
    $firstName: String!
    $lastName: String!
    $email: String!
  ) {
    insert_User(
      objects: {
        id: $userId
        lastName: $lastName
        firstName: $firstName
        email: $email
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
