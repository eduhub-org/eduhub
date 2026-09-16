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
      type
    }
    CourseLocations {
      locationOption
    }
    # Events have no weekday: their tile date, listing order and "past" marker
    # all come from the sessions.
    Sessions(order_by: { startDateTime: asc }) {
      id
      startDateTime
      endDateTime
    }
  }
`;