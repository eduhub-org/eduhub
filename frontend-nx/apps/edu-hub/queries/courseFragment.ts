import { gql } from "@apollo/client";
import { COURSE_INSTRUCTOR_FRAGMENT } from "./courseInstructorFragment";
import { PROGRAM_FRAGMENT_MINIMUM_PROPERTIES } from "./programFragment";
import { ENROLLMENT_FRAGMENT } from "./enrollmentFragment";

import { SESSION_FRAGMENT } from "./sessionFragement";

export const COURSE_FRAGMENT = gql`
  ${SESSION_FRAGMENT}
  ${COURSE_INSTRUCTOR_FRAGMENT}
  ${PROGRAM_FRAGMENT_MINIMUM_PROPERTIES}
  ${ENROLLMENT_FRAGMENT}
  fragment CourseFragment on Course {
    id
    ects
    tagline
    weekDay
    cost
    published
    applicationEnd
    coverImage
    language
    maxMissedSessions
    title
    programId
    maxParticipants
    headingDescriptionField1
    contentDescriptionField1
    headingDescriptionField2
    contentDescriptionField2
    startTime
    endTime
    Sessions {
      ...SessionFragment
    }
    CourseInstructors(order_by: { id: desc }) {
      ...CourseInstructorFragment
    }
    CourseLocations {
      id
      defaultSessionAddress
      locationOption
    }
    Program {
      ...ProgramFragmentMinimumProperties
    }
    CourseGroups {
      id
      CourseGroupOption {
        id
        title
        order
      }
    }
}
`;

export const ADMIN_COURSE_FRAGMENT = gql`
  ${COURSE_FRAGMENT}
  fragment AdminCourseFragment on Course {
    ...CourseFragment
    status
    published
    achievementCertificatePossible
    attendanceCertificatePossible
    chatLink
    learningGoals
    Program {
      id
      title
      shortTitle
      lectureStart
      lectureEnd
    }
  }
`;
