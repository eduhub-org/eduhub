import { gql } from "@apollo/client";
import { COURSE_INSTRUCTOR_FRAGMENT, COURSE_INSTRUCTOR_FRAGMENT_ANONYMOUS } from "./courseInstructorFragment";
import { PROGRAM_FRAGMENT_MINIMUM_PROPERTIES } from "./programFragment";
import { ENROLLMENT_FRAGMENT } from "./enrollmentFragment";

import { SESSION_FRAGMENT } from './sessionFragement';


export const COURSE_TILE_FRAGMENT_ANONYMOUS = gql`
  fragment CourseTileFragmentAnonymous on Course {
    id
    weekDay
    published
    coverImage
    language
    title
    startTime
    endTime
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


export const COURSE_FRAGMENT = gql`
  ${SESSION_FRAGMENT}
  ${COURSE_INSTRUCTOR_FRAGMENT}
  ${PROGRAM_FRAGMENT_MINIMUM_PROPERTIES}
  ${ENROLLMENT_FRAGMENT}
  fragment CourseFragment on Course {
    id
    ects
    # A degree publishes the ECTS it requires, not ECTS it awards (see InfoPanel).
    requiredEcts
    tagline
    weekDay
    published
    applicationEnd
    coverImage
    language
    maxMissedSessions
    chatLink
    title
    achievementCertificatePossible
    attendanceCertificatePossible
    projectProposalsEnabled
    projectSubmissionDeadline
    programId
    maxParticipants
    activeParticipantCount
    learningGoals
    headingDescriptionField1
    contentDescriptionField1
    headingDescriptionField2
    contentDescriptionField2
    externalRegistrationLink
    registrationType
    guestRegistrationEnabled
    formbricksEnrollmentSurveyUrl
    startTime
    endTime
    Sessions (order_by: { startDateTime: asc }) {
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
    DegreeCourses {
      id
      courseId
      Course {
        id
        title
        published
        ects
        Program {
          id
          published
        }
      }
    }
    CourseFundingOrganizations {
      id
      Organization {
        id
        name
        description
        type
        logo
      }
    }
    basePrice
    currency
    CourseAddonMappings {
      id
      description
      validatedPrice
      currency
    }
}
`;

export const ADMIN_COURSE_FRAGMENT = gql`
  ${COURSE_FRAGMENT}
  ${PROGRAM_FRAGMENT_MINIMUM_PROPERTIES}
  fragment AdminCourseFragment on Course {
    ...CourseFragment
    learningGoals
    status
    published
    achievementCertificatePossible
    attendanceCertificatePossible
    projectProposalsEnabled
    projectSubmissionDeadline
    requiredEventCount
    chatLink
    matrixRoomId
    registrationType
    guestRegistrationEnabled
    formbricksEnrollmentSurveyUrl
    basePrice
    currency
    stripeProductId
    stripePriceId
    Program {
      ...ProgramFragmentMinimumProperties
      matrixSpaceId
      matrixInstructorRoomId
    }
  }
`;

export const COURSE_FRAGMENT_MINIMUM = gql`
  fragment CourseFragmentMinimum on Course {
    id
    title
    status
    ects
    tagline
    language
    applicationEnd
    achievementCertificatePossible
    attendanceCertificatePossible
    maxMissedSessions
    weekDay
    coverImage
    programId
    learningGoals
    chatLink
    published
    maxParticipants
    activeParticipantCount
    endTime
    startTime
    registrationType
    formbricksEnrollmentSurveyUrl
  }
`;

export const COURSE_FRAGMENT_ANONYMOUS = gql`
  ${SESSION_FRAGMENT}
  ${COURSE_INSTRUCTOR_FRAGMENT_ANONYMOUS}
  ${PROGRAM_FRAGMENT_MINIMUM_PROPERTIES}
  ${ENROLLMENT_FRAGMENT}
  fragment CourseFragmentAnonymous on Course {
    id
    ects
    tagline
    weekDay
    published
    applicationEnd
    coverImage
    language
    maxMissedSessions
    chatLink
    title
    achievementCertificatePossible
    attendanceCertificatePossible
    programId
    maxParticipants
    activeParticipantCount
    learningGoals
    headingDescriptionField1
    contentDescriptionField1
    headingDescriptionField2
    contentDescriptionField2
    externalRegistrationLink
    registrationType
    guestRegistrationEnabled
    formbricksEnrollmentSurveyUrl
    startTime
    endTime
    Sessions (order_by: { startDateTime: asc }) {
      ...SessionFragment
    }
    CourseInstructors(order_by: { id: desc }) {
      ...CourseInstructorFragmentAnonymous
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
    DegreeCourses {
      id
      courseId
      Course {
        id
        title
        published
        ects
        Program {
          id
          published
        }
      }
    }
    CourseFundingOrganizations {
      id
      Organization {
        id
        name
        description
        type
        logo
      }
    }
    basePrice
    currency
    CourseAddonMappings {
      id
      description
      validatedPrice
      currency
    }
}
`;
