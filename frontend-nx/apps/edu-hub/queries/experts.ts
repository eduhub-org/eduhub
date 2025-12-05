import { gql } from '@apollo/client';

export const EXPERTS_BY_LAST_NAME = gql`
  query ExpertsByLastName(
    $limit: Int = 10
    $offset: Int = 0
    $filter: User_bool_exp = {}
    $order_by: [User_order_by!] = [{ updated_at: desc }]
  ) {
    User(
      limit: $limit
      offset: $offset
      order_by: $order_by
      where: {
        _and: [
          { status: { _eq: ACTIVE } }
          {
            _or: [
              { CourseInstructors: {} }
              { SessionSpeakers: {} }
            ]
          }
          $filter
        ]
      }
    ) {
      id
      firstName
      lastName
      email
      CourseInstructors {
        id
        Course {
          id
          title
          tagline
          contentDescriptionField1
          contentDescriptionField2
          headingDescriptionField1
          headingDescriptionField2
          Program {
            id
            shortTitle
          }
        }
      }
      SessionSpeakers {
        id
        Session {
          id
          title
          description
          Course {
            id
            title
            Program {
              id
              shortTitle
            }
          }
        }
      }
    }
    User_aggregate(
      where: {
        _and: [
          { status: { _eq: ACTIVE } }
          {
            _or: [
              { CourseInstructors: {} }
              { SessionSpeakers: {} }
            ]
          }
          $filter
        ]
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

