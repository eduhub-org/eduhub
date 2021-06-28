import { gql } from "@apollo/client";

import { COURSE_FRAGMENT } from "./courseFragment";

export const INSERT_ENROLLMENT = gql`
  ${COURSE_FRAGMENT}
  mutation InsertEnrollment(
    $participantId: Int!
    $courseId: Int!
    $motivationLetter: String!
  ) {
    insert_Enrollment(
      objects: {
        ParticipantId: $participantId
        CourseId: $courseId
        MotivationLetter: $motivationLetter
        WantsEcts: false
      }
    ) {
      affected_rows
      returning {
        Id
        Course {
          ...CourseFragment
        }
        Participant {
          Id
          Person {
            Id
            Firstname
            Lastname
          }
        }
        Status
      }
    }
  }
`;
