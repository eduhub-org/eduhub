import { gql } from "@apollo/client";

export const COURSE_TILE_FRAGMENT = gql`
  fragment CourseTileFragment on Course {
    id
    title
    tagline
    coverImage
    language
    weekDay
    startTime
    endTime
    Program {
      published
      title
    }
    CourseLocations {
      locationOption
    }
  }
`;