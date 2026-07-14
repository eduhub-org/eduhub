import { gql } from '@apollo/client';

export const COURSE_GROUP_OPTIONS = gql`
  query CourseGroupOptions {
    CourseGroupOption(order_by: { order: asc }) {
      id
      order
      title
      sliderGroup
      contentType
      programType
      organizationId
      SelectedCourseGroups {
        id
        courseGroupOptionId
      }
      SelectedProjectGroups {
        id
        projectGroupOptionId
      }
      SelectedJobTypes {
        id
        jobType
      }
    }
  }
`;

// Admin variant that also returns the number of courses manually connected to
// each group option (used to decide whether an option can be deleted).
export const ADMIN_COURSE_GROUP_OPTIONS = gql`
  query AdminCourseGroupOptions {
    CourseGroupOption(order_by: { order: asc }) {
      id
      order
      title
      sliderGroup
      programType
      organizationId
      CourseGroups_aggregate {
        aggregate {
          count
        }
      }
    }
  }
`;

// Mutation to update the order of a CourseGroupOption by its primary key
export const UPDATE_COURSE_GROUP_OPTION_ORDER = gql`
  mutation UpdateCourseGroupOptionOrder($id: Int!, $order: Int!) {
    update_CourseGroupOption_by_pk(pk_columns: { id: $id }, _set: { order: $order }) {
      id
      order
      __typename
    }
  }
`;

// Mutation to toggle whether a CourseGroupOption is shown as a slider on the homepage
export const UPDATE_COURSE_GROUP_OPTION_SLIDER_GROUP = gql`
  mutation UpdateCourseGroupOptionSliderGroup($id: Int!, $sliderGroup: Boolean!) {
    update_CourseGroupOption_by_pk(pk_columns: { id: $id }, _set: { sliderGroup: $sliderGroup }) {
      id
      sliderGroup
      __typename
    }
  }
`;

// Mutation to add a new CourseGroupOption
export const INSERT_COURSE_GROUP_OPTION = gql`
  mutation InsertCourseGroupOption($title: String!, $order: Int!, $sliderGroup: Boolean!) {
    insert_CourseGroupOption_one(object: { title: $title, order: $order, sliderGroup: $sliderGroup }) {
      id
      title
      order
      sliderGroup
      __typename
    }
  }
`;

// Mutation to delete a CourseGroupOption by its primary key
export const DELETE_COURSE_GROUP_OPTION = gql`
  mutation DeleteCourseGroupOption($id: Int!) {
    delete_CourseGroupOption_by_pk(id: $id) {
      id
      __typename
    }
  }
`;
