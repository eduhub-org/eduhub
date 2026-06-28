import { gql } from '@apollo/client';

// Project sliders are CourseGroupOption rows with contentType = 'PROJECT'.
export const ADMIN_PROJECT_SLIDERS = gql`
  query AdminProjectSliders {
    CourseGroupOption(where: { contentType: { _eq: "PROJECT" } }, order_by: { order: asc }) {
      id
      title
      order
      sliderGroup
      SelectedCourseGroups {
        id
        courseGroupOptionId
      }
      SelectedProjectGroups {
        id
        projectGroupOptionId
      }
    }
  }
`;

// Source groups available to feed a project slider.
export const ADMIN_PROJECT_SLIDER_SOURCES = gql`
  query AdminProjectSliderSources {
    CourseGroupOption(where: { contentType: { _eq: "COURSE" } }, order_by: { order: asc }) {
      id
      title
    }
    ProjectGroupOption(order_by: { order: asc }) {
      id
      title
    }
  }
`;

export const INSERT_PROJECT_SLIDER = gql`
  mutation InsertProjectSlider($title: String!, $order: Int!) {
    insert_CourseGroupOption_one(
      object: { title: $title, order: $order, sliderGroup: true, contentType: "PROJECT" }
    ) {
      id
      title
      __typename
    }
  }
`;

export const DELETE_PROJECT_SLIDER = gql`
  mutation DeleteProjectSlider($id: Int!) {
    delete_CourseGroupOption_by_pk(id: $id) {
      id
      __typename
    }
  }
`;

export const INSERT_PROJECT_SLIDER_COURSE_GROUP = gql`
  mutation InsertProjectSliderCourseGroup($projectSliderOptionId: Int!, $courseGroupOptionId: Int!) {
    insert_ProjectSliderCourseGroup_one(
      object: { projectSliderOptionId: $projectSliderOptionId, courseGroupOptionId: $courseGroupOptionId }
    ) {
      id
      __typename
    }
  }
`;

export const DELETE_PROJECT_SLIDER_COURSE_GROUP = gql`
  mutation DeleteProjectSliderCourseGroup($id: Int!) {
    delete_ProjectSliderCourseGroup_by_pk(id: $id) {
      id
      __typename
    }
  }
`;

export const INSERT_PROJECT_SLIDER_PROJECT_GROUP = gql`
  mutation InsertProjectSliderProjectGroup($projectSliderOptionId: Int!, $projectGroupOptionId: Int!) {
    insert_ProjectSliderProjectGroup_one(
      object: { projectSliderOptionId: $projectSliderOptionId, projectGroupOptionId: $projectGroupOptionId }
    ) {
      id
      __typename
    }
  }
`;

export const DELETE_PROJECT_SLIDER_PROJECT_GROUP = gql`
  mutation DeleteProjectSliderProjectGroup($id: Int!) {
    delete_ProjectSliderProjectGroup_by_pk(id: $id) {
      id
      __typename
    }
  }
`;
