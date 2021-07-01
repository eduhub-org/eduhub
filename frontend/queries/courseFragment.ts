import { gql } from "@apollo/client";

export const COURSE_FRAGMENT = gql`
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
    MaxParticipants
    Name
    OnlineCourses
    SemesterId
    Status
    ShortDescription
    TimeOfStart
    Sessions {
      Id
      Finish
      CourseId
      Description
      Location
      Start
      Title
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
