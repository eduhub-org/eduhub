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
    applicationEnd
    published
    Program {
      published
      title
      defaultApplicationEnd
      showExtendedApplicationPeriodBanner
    }
    CourseLocations {
      locationOption
    }
  }
`;