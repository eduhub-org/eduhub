import { gql } from '@apollo/client';
import { PROJECT_FRAGMENT_DETAILED } from './project';

// Cross-course project overview for the admin "/manage/projects" page.
//
// Reuses PROJECT_FRAGMENT_DETAILED (the same selection the course-page project
// preview renders) and additionally pulls the owning course, its program and
// course-group options so the list can show and be filtered by them.
//
// Author name / email search is applied through the `where` variable
// (server-side, admin role) and therefore does NOT need to select the email
// column — so the shared fragment stays usable under the user/anonymous roles
// that lack the email column permission.
export const ADMIN_PROJECT_LIST = gql`
  ${PROJECT_FRAGMENT_DETAILED}
  query AdminProjectList(
    $where: Project_bool_exp
    $order_by: [Project_order_by!]
    $limit: Int
    $offset: Int
  ) {
    Project(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
      ...ProjectFragmentDetailed
      ProjectCourses {
        courseId
        Course {
          id
          title
          programId
          Program {
            id
            title
            shortTitle
          }
          CourseGroups {
            id
            CourseGroupOption {
              id
              title
            }
          }
        }
      }
    }
    Project_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

// Toggles showcase publication independently of the lifecycle status. Publishing
// also clears suggestedForPublication (the recommendation is fulfilled); on
// unpublish the caller passes the current flag value so it is left untouched.
// Admin-only page: the admin role bypasses Hasura row/column permissions.
export const UPDATE_PROJECT_PUBLISHED = gql`
  mutation UpdateProjectPublished(
    $itemId: Int!
    $published: Boolean!
    $suggestedForPublication: Boolean!
  ) {
    update_Project_by_pk(
      pk_columns: { id: $itemId }
      _set: { published: $published, suggestedForPublication: $suggestedForPublication }
    ) {
      id
      published
      suggestedForPublication
    }
  }
`;
