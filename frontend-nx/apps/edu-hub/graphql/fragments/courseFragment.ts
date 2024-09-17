import { graphql } from '../../types/generated';

export const COURSE_TILE_FRAGMENT_ANONYMOUS = graphql(`
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
`);

export const COURSE_FRAGMENT = graphql(`
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
    chatLink
    title
    achievementCertificatePossible
    attendanceCertificatePossible
    programId
    maxParticipants
    learningGoals
    headingDescriptionField1
    contentDescriptionField1
    headingDescriptionField2
    contentDescriptionField2
    externalRegistrationLink
    startTime
    endTime
    Sessions(order_by: { startDateTime: asc }) {
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
  }
`);

export const ADMIN_COURSE_FRAGMENT = graphql(`
  fragment AdminCourseFragment on Course {
    ...CourseFragment
    learningGoals
    status
    published
    achievementCertificatePossible
    attendanceCertificatePossible
    chatLink
    Program {
      ...ProgramFragmentMinimumProperties
    }
  }
`);

export const COURSE_FRAGMENT_MINIMUM = graphql(`
  fragment CourseFragmentMinimum on Course {
    id
    title
    status
    ects
    tagline
    language
    applicationEnd
    cost
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
    endTime
    startTime
  }
`);
