import { graphql } from '../../types/generated';

export const COURSE_TILE_FRAGMENT = graphql(`
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
`);
