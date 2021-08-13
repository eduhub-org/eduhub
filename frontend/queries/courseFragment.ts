import { gql } from "@apollo/client";

import { SESSION_FRAGMENT } from "./sessionFragement";

export const COURSE_FRAGMENT = gql`
  ${SESSION_FRAGMENT}
  fragment CourseFragment on Course {
    Id
    Ects
    Duration
    Description
    DayOfTheWeek
    CourseType
    Cost
    City
    BookingDeadline
    Image
    Language
    MaxMissedDates
    MaxParticipants
    Name
    OnlineCourses
    ProgramId
    Status
    ShortDescription
    TimeOfStart
    LinkChat
    LinkVideoCall
    Sessions {
      ...SessionFragment
    }
    CourseInstructors {
      Id
      Instructor {
        Id
        Person {
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
