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
  fragment AdminCourseFragment on Course {
    id
    ects
    coverImage
    language
    maxMissedSessions
    title
    programId
    status
    visibility
    achievementCertificatePossible
    attendanceCertificatePossible
    chatLink
    learningGoals
    headingDescriptionField1
    headingDescriptionField2
    contentDescriptionField1
    contentDescriptionField2
    weekDay
    startTime
    endTime
    Program {
      id
      title
      shortTitle
      lectureStart
      lectureEnd
    }
    CourseInstructors(order_by: { id: desc }) {
      id
      Expert {
        id
        User {
          firstName
          id
          lastName
        }
      }
    }
    CourseEnrollments {
      id
      CourseEnrollmentStatus {
        value
      }
    }
    AppliedAndUnratedCount: CourseEnrollments_aggregate(
      where: {
        _and: [
          { CourseEnrollmentStatus: { value: { _eq: "APPLIED" } } }
          { MotivationRating: { value: { _eq: "UNRATED" } } }
        ]
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;
