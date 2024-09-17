import { graphql } from '../../types/generated';

export const USER_FRAGMENT = graphql(`
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
`);
