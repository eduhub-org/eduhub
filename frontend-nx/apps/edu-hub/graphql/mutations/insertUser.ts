import { graphql } from '../../types/generated';

export const INSERT_USER = graphql(`
  mutation InsertUser($userId: uuid!, $firstName: String!, $lastName: String!, $email: String!) {
    insert_User(objects: { id: $userId, lastName: $lastName, firstName: $firstName, email: $email }) {
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
`);

export const INSERT_A_USER = graphql(`
  mutation InsertSingleUser($user: User_insert_input!) {
    insert_User_one(object: $user) {
      id
      picture
      email
      firstName
      lastName
    }
  }
`);
