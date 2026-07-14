import { gql } from '@apollo/client';

// Job sliders are CourseGroupOption rows with contentType = 'JOB'.
export const ADMIN_JOB_SLIDERS = gql`
  query AdminJobSliders {
    CourseGroupOption(where: { contentType: { _eq: "JOB" } }, order_by: { order: asc }) {
      id
      title
      order
      sliderGroup
      SelectedJobTypes {
        id
        jobType
      }
    }
  }
`;

// Source job types available to feed a job slider.
export const ADMIN_JOB_SLIDER_SOURCES = gql`
  query AdminJobSliderSources {
    JobPostingType(order_by: { value: asc }) {
      value
    }
  }
`;

export const INSERT_JOB_SLIDER = gql`
  mutation InsertJobSlider($title: String!, $order: Int!) {
    insert_CourseGroupOption_one(object: { title: $title, order: $order, sliderGroup: true, contentType: "JOB" }) {
      id
      title
      __typename
    }
  }
`;

export const DELETE_JOB_SLIDER = gql`
  mutation DeleteJobSlider($id: Int!) {
    delete_CourseGroupOption_by_pk(id: $id) {
      id
      __typename
    }
  }
`;

// JobSliderJobType.jobType is an FK to the JobPostingType enum table
// (is_enum: true), so Hasura exposes it as JobPostingType_enum, not String.
export const INSERT_JOB_SLIDER_JOB_TYPE = gql`
  mutation InsertJobSliderJobType($jobSliderOptionId: Int!, $jobType: JobPostingType_enum!) {
    insert_JobSliderJobType_one(object: { jobSliderOptionId: $jobSliderOptionId, jobType: $jobType }) {
      id
      __typename
    }
  }
`;

export const DELETE_JOB_SLIDER_JOB_TYPE = gql`
  mutation DeleteJobSliderJobType($id: Int!) {
    delete_JobSliderJobType_by_pk(id: $id) {
      id
      __typename
    }
  }
`;
