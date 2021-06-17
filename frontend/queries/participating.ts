import { gql } from "@apollo/client";

export const PARTICIPATING = gql`
  query Participating($id: Int!) {
    Person_by_pk(Id: $id) {
      Participants {
        Enrollments {
          Course {
            DayOfTheWeek
            Duration
            OnlineCoursesAllowed
            Online_Hybrid_Offline
            ProjectsAllowed
            TimeOfStart
            Ects
            Id
            Language
            MaxMissedDates
            MaxParticipants
            MaxProjectParticipants
            Name
          }
        }
      }
    }
  }
`;
