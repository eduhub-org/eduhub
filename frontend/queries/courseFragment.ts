import { gql } from "@apollo/client";

import { SESSION_FRAGMENT } from "./sessionFragement";

export const COURSE_FRAGMENT = gql`
  ${SESSION_FRAGMENT}
  fragment CourseFragment on Course {
    Id
    Ects
    Description
    WeekDay
    CourseType
    Cost
    City
    ApplicationEnd
    Image
    Language
    MaxMissedSessions
    MaxParticipants
    Name
    OnlineCourses
    ProgramId
    Status
    ShortDescription
    TimeStart
    TimeEnd
    Sessions {
      ...SessionFragment
    }
    CourseInstructors {
      Id
      Instructor {
        Id
        User {
          Firstname
          Image
          Id
          Lastname
        }
        Qualification
        Description
      }
    }
  }
`;
