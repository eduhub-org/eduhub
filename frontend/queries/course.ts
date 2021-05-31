import { gql } from "@apollo/client";

export const COURSE = gql`
  query Course($id: Int!) {
    Course_by_pk(Id: $id) {
      BookingDeadline
      Cost
      CourseType
      DayOfTheWeek
      Description
      Difficulty
      Duration
      Id
      Image
      Language
      MaxParticipants
      Name
      Semester
      Sessions {
        Description
        Finish
        Id
        Start
        Title
        SurveyType
        SurveyId
      }
      ShortDescription
      Status
      TimeOfStart
    }
  }
`;
