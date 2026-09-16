import { gql } from '@apollo/client';

/**
 * Everything the course page needs to render its <head> on the server: the
 * title/description/image meta tags and the JSON-LD structured data.
 *
 * Deliberately separate from COURSE_ANONYMOUS and lean — it runs on every
 * request, before the page's own client-side query, and only needs the fields
 * that end up in markup a crawler reads.
 */
export const COURSE_SEO = gql`
  query CourseSeo($id: Int!) {
    Course_by_pk(id: $id) {
      id
      title
      tagline
      coverImage
      language
      published
      registrationType
      applicationEnd
      basePrice
      currency
      maxParticipants
      requiredEcts
      contentDescriptionField1
      Program {
        id
        type
        title
        published
      }
      CourseLocations {
        id
        locationOption
        defaultSessionAddress
      }
      Sessions(order_by: { startDateTime: asc }) {
        id
        title
        description
        startDateTime
        endDateTime
        SessionSpeakers {
          id
          User {
            id
            firstName
            lastName
          }
        }
      }
      CourseInstructors {
        id
        User {
          id
          firstName
          lastName
        }
      }
      DegreeCourses {
        id
        Course {
          id
          title
          published
          Program {
            id
            published
          }
        }
      }
    }
  }
`;
