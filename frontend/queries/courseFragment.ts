import { gql } from "@apollo/client";

import { SESSION_FRAGMENT } from "./sessionFragement";

export const COURSE_FRAGMENT = gql`
  ${SESSION_FRAGMENT}
  fragment CourseFragment on Course {
    id
    ects
    tagline
    weekDay
    cost
    applicationEnd
    coverImage
    language
    maxMissedSessions
    title
    programId
    headingDescriptionField1
    contentDescriptionField1
    headingDescriptionField2
    contentDescriptionField2
    startTime
    endTime
    Sessions {
      ...SessionFragment
    }
    CourseInstructors {
      id
      Expert {
        id
        User {
          firstName
          picture
          id
          lastName
        }
        description
      }
    }
  }
`;

export const ADMIN_COURSE_FRAGMENT = gql`
  ${SESSION_FRAGMENT}
  fragment CourseFragment on Course {
    id
    title
    status
    ects
    programId
    CourseInstructors {
      id
      Expert {
        id
        User {
          firstName
          picture
          id
          lastName
        }
        description
      }
    }
  }
`;
