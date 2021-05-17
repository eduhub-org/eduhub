import { gql } from "@apollo/client";

export const COURSE_LIST = gql`
  query CourseList {
    Course {
      Cost
      DayOfTheWeek
      CourseType
      Description
      Difficulty
      Duration
      Ects
      Id
      Language
      MaxParticipants
      Name
      Semester
      ShortDescription
      TimeOfStart
    }
  }
`;
