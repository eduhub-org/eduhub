import { gql } from "@apollo/client";

export const USER_FRAGMENT = gql`
  fragment UserFragment on User {
    id
    firstName
    lastName
    email
    picture
    externalProfile
    university
    otherUniversity
  }
`;
